# window_physics_persistent.py
# Keeps running forever, rescans windows every few seconds.
# Survives permission or handle errors gracefully.
# Same physics: gravity, bounces, top-surface friction, highlight on double-click.

import ctypes, time
from itertools import combinations
from collections import deque

# ----------------------------------------------------------
# Windows API bindings
# ----------------------------------------------------------
user32   = ctypes.WinDLL("user32", use_last_error=True)
gdi32    = ctypes.WinDLL("gdi32",  use_last_error=True)
kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

def get_hinstance(): return kernel32.GetModuleHandleW(None)

EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
SWP_NOSIZE=0x0001; SWP_NOZORDER=0x0004; SWP_NOACTIVATE=0x0010
HWND_TOPMOST=-1; LWA_ALPHA=0x02; RGN_DIFF=4

# ----------------------------------------------------------
# Structs and constants
# ----------------------------------------------------------
class RECT(ctypes.Structure):
    _fields_=[("left",ctypes.c_long),("top",ctypes.c_long),
              ("right",ctypes.c_long),("bottom",ctypes.c_long)]
class WNDCLASS(ctypes.Structure):
    _fields_=[("style",ctypes.c_uint),("lpfnWndProc",ctypes.c_void_p),
              ("cbClsExtra",ctypes.c_int),("cbWndExtra",ctypes.c_int),
              ("hInstance",ctypes.c_void_p),("hIcon",ctypes.c_void_p),
              ("hCursor",ctypes.c_void_p),("hbrBackground",ctypes.c_void_p),
              ("lpszMenuName",ctypes.c_wchar_p),("lpszClassName",ctypes.c_wchar_p)]

# ----------------------------------------------------------
# Config
# ----------------------------------------------------------
WHITELIST_TITLES=["Notepad","Paint","Calculator"]
GRAVITY=2500.0; AIR_DRAG=0.998; REST=0.25
FRICTION_GROUND=0.90; FRICTION_SURFACE=0.88
TARGET_HZ=60; HISTORY_WINDOW=0.2
MAX_THROW_VX=2200; MAX_THROW_VY=2600
VEL_FLOOR_STOP=20; VEL_DRIFT_STOP=15
DOUBLECLICK_SEC=0.4; MAX_STEP=240

# ----------------------------------------------------------
# Utility
# ----------------------------------------------------------
def clamp(v,lo,hi): return lo if v<lo else hi if v>hi else v
def left_mouse_down(): return (user32.GetAsyncKeyState(0x01)&0x8000)!=0
def get_virtual_bounds():
    x=user32.GetSystemMetrics(76);y=user32.GetSystemMetrics(77)
    w=user32.GetSystemMetrics(78);h=user32.GetSystemMetrics(79)
    return (x,y,x+w,y+h)
def get_rect(hwnd):
    r=RECT()
    if not user32.GetWindowRect(hwnd,ctypes.byref(r)): raise OSError
    return r.left,r.top,r.right,r.bottom
def set_pos(hwnd,x,y):
    if not user32.SetWindowPos(hwnd,None,int(x),int(y),0,0,
                               SWP_NOSIZE|SWP_NOZORDER|SWP_NOACTIVATE):
        raise OSError
def get_title(hwnd):
    buf=ctypes.create_unicode_buffer(256)
    user32.GetWindowTextW(hwnd,buf,256)
    return buf.value
def visible(hwnd): return bool(user32.IsWindowVisible(hwnd))
def title_matches(t): return any(k.lower() in t.lower() for k in WHITELIST_TITLES)

# ----------------------------------------------------------
# Overlay border (for highlight)
# ----------------------------------------------------------
class Overlay:
    _cls="PhysicsOverlay"
    def __init__(self,border_px=3,color_rgb=(0,120,215),alpha=200):
        self.border_px=border_px;self.color=color_rgb;self.alpha=alpha
        self._register();self._create();self.hide()
    def _wndproc(self,hwnd,msg,wp,lp): return user32.DefWindowProcW(hwnd,msg,wp,lp)
    def _register(self):
        wc=WNDCLASS();wc.lpfnWndProc=ctypes.WINFUNCTYPE(ctypes.c_long,ctypes.c_void_p,ctypes.c_uint,ctypes.c_void_p,ctypes.c_void_p)(self._wndproc)
        wc.hInstance=get_hinstance();wc.lpszClassName=self._cls
        user32.RegisterClassW(ctypes.byref(wc))
    def _create(self):
        ex=0x00000080|0x00000008|0x00080000|0x00000020
        self.hwnd=user32.CreateWindowExW(ex,self._cls,None,0x80000000,0,0,100,100,
                                         None,None,get_hinstance(),None)
        user32.SetLayeredWindowAttributes(self.hwnd,0,self.alpha,LWA_ALPHA)
    def move(self,l,t,r,b):
        bw=self.border_px;w=max(1,int(r-l));h=max(1,int(b-t))
        outer=gdi32.CreateRectRgn(0,0,w,h)
        inner=gdi32.CreateRectRgn(bw,bw,w-bw,h-bw)
        hollow=gdi32.CreateRectRgn(0,0,0,0)
        gdi32.CombineRgn(hollow,outer,inner,RGN_DIFF)
        user32.SetWindowRgn(self.hwnd,hollow,True)
        user32.SetWindowPos(self.hwnd,HWND_TOPMOST,int(l),int(t),w,h,0x0010)
    def show(self): user32.ShowWindow(self.hwnd,5)
    def hide(self): user32.ShowWindow(self.hwnd,0)

# ----------------------------------------------------------
# Physics body
# ----------------------------------------------------------
class Body:
    def __init__(self,hwnd,title,l,t,w,h):
        self.hwnd=hwnd;self.title=title
        self.x,self.y=float(l),float(t);self.w,self.h=w,h
        self.vx=self.vy=0.0;self.nx,self.ny=self.x,self.y
        self.mass=max(0.25,min(8.0,(w*h)/1e5))
        self.dragging=False;self.history=deque(maxlen=10)

# ----------------------------------------------------------
# Collision
# ----------------------------------------------------------
def resolve(a,b):
    ax1,ay1,ax2,ay2=a.nx,a.ny,a.nx+a.w,a.ny+a.h
    bx1,by1,bx2,by2=b.nx,b.ny,b.nx+b.w,b.ny+b.h
    ox=min(ax2,bx2)-max(ax1,bx1);oy=min(ay2,by2)-max(ay1,by1)
    if ox<=0 or oy<=0:return None
    if ox<oy:
        s=1 if a.x<b.x else -1
        a.nx-=ox*0.5*s;b.nx+=ox*0.5*s
        va,vb=a.vx,b.vx;m1,m2=a.mass,b.mass
        a.vx=((va*(m1-m2)+2*m2*vb)/(m1+m2))*REST
        b.vx=((vb*(m2-m1)+2*m1*va)/(m1+m2))*REST
    else:
        s=1 if a.y<b.y else -1
        a.ny-=oy*0.5*s;b.ny+=oy*0.5*s
        va,vb=a.vy,b.vy;m1,m2=a.mass,b.mass
        a.vy=((va*(m1-m2)+2*m2*vb)/(m1+m2))*REST
        b.vy=((vb*(m2-m1)+2*m1*va)/(m1+m2))*REST
        if s>0:return (a,b)
        else:return (b,a)
    return None

# ----------------------------------------------------------
# Manager
# ----------------------------------------------------------
class Manager:
    def __init__(self):
        self.bounds=get_virtual_bounds()
        self.overlay=Overlay()
        self.selected=None
        self.prev_lmb=False;self.last_click_hwnd=None;self.last_click_time=0
        self.bodies=[];self.last_t=time.time();self.last_scan=0

    def scan(self):
        allwins=[]
        def cb(hwnd,lp):
            if visible(hwnd):
                t=get_title(hwnd).strip()
                if not t:return True
                try:l,t_,r,b=get_rect(hwnd)
                except OSError:return True
                if title_matches(t):allwins.append((hwnd,t,l,t_,r-l,b-t))
            return True
        user32.EnumWindows(EnumWindowsProc(cb),0)
        self.bodies=[Body(*w) for w in allwins]
        if allwins: print(f"[scan] {len(allwins)} matching windows")
        else: print("[scan] none found")

    def dblclick(self):
        lmb=left_mouse_down();fg=user32.GetForegroundWindow();now=time.time()
        if not lmb and self.prev_lmb:
            if fg==self.last_click_hwnd and (now-self.last_click_time)<=DOUBLECLICK_SEC:
                self.selected=fg;print(f"[select] {get_title(fg)}")
            else:
                self.last_click_hwnd=fg;self.last_click_time=now
        self.prev_lmb=lmb
        if self.selected:
            try:l,t,r,b=get_rect(self.selected)
            except: self.overlay.hide();self.selected=None;return
            self.overlay.move(l-2,t-2,r+2,b+2);self.overlay.show()

    def detect_drag(self,b):
        fg=user32.GetForegroundWindow()
        if left_mouse_down() and fg==b.hwnd:
            b.dragging=True;b.history.append((time.time(),b.x,b.y))
        else:
            if b.dragging and not left_mouse_down():self.throw(b)
            b.dragging=False

    def throw(self,b):
        if len(b.history)<2:return
        t1,x1,y1=b.history[-1]
        for t0,x0,y0 in reversed(b.history):
            if t1-t0>=HISTORY_WINDOW:break
        else:t0,x0,y0=b.history[0]
        dt=max(0.01,t1-t0)
        b.vx=clamp((x1-x0)/dt,-MAX_THROW_VX,MAX_THROW_VX)
        b.vy=clamp((y1-y0)/dt,-MAX_THROW_VY,MAX_THROW_VY)

    def step(self):
        now=time.time();dt=clamp(now-self.last_t,1/240,1/20);self.last_t=now
        # periodic rescan
        if now-self.last_scan>3:
            self.scan();self.last_scan=now
        self.dblclick()
        L,T,R,B=self.bounds
        for b in list(self.bodies):
            try:l,t,r,bm=get_rect(b.hwnd)
            except:continue
            b.x,b.y=l,t;b.w,b.h=max(1,r-l),max(1,bm-t)
            self.detect_drag(b)
        for b in self.bodies:
            if b.dragging:b.vx=b.vy=0;b.nx,b.ny=b.x,b.y;continue
            b.vy+=GRAVITY*dt;b.vx*=AIR_DRAG;b.vy*=AIR_DRAG
            b.nx=b.x+b.vx*dt;b.ny=b.y+b.vy*dt
        contacts=[]
        for _ in range(2):
            for a,b in combinations(self.bodies,2):
                if a.dragging or b.dragging:continue
                pair=resolve(a,b)
                if pair:contacts.append(pair)
        for top,bottom in contacts:
            if abs(top.vy)<VEL_FLOOR_STOP:top.vy=0
            top.ny=bottom.ny-top.h
            if abs(top.vx)<VEL_DRIFT_STOP:top.vx=0
            else:top.vx*=FRICTION_SURFACE
        for b in self.bodies:
            floor=B-b.h
            if b.ny>=floor:
                b.ny=floor
                if abs(b.vy)<VEL_FLOOR_STOP:b.vy=0
                else:b.vy=-abs(b.vy)*REST
                if abs(b.vx)<VEL_DRIFT_STOP:b.vx=0
                else:b.vx*=FRICTION_GROUND
            try:set_pos(b.hwnd,b.nx,b.ny)
            except OSError:print("[warn] failed move");continue
            b.x,b.y=b.nx,b.ny

    def run(self):
        print("Running persistent window physics (Ctrl+C to quit)")
        while True:
            try:self.step();time.sleep(1/TARGET_HZ)
            except KeyboardInterrupt:break
            except Exception as e:
                print("[err]",e);time.sleep(1)

# ----------------------------------------------------------
# Main
# ----------------------------------------------------------
if __name__=="__main__":
    m=Manager();m.run()
