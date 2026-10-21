/** Click targets follow the actual captured sidebar, after undoing display letterboxing. */
const sizes:Record<string,[number,number]>={"overview-detail": [1901, 939], "live": [1921, 1032], "inverters": [1919, 1028], "production": [1901, 1028], "alarms": [1889, 1019], "limits": [1919, 1031], "site-devices": [1902, 1018], "site-alarms": [1922, 984], "overview": [1902, 1078]};
export function screenMenuTarget(id:string,u:number,v:number):number|null{
 const size=sizes[id];if(!size)return null;const [w,h]=size,scale=Math.min(1024/w,548/h),x=(u*1024-(1024-w*scale)/2)/scale,y=(v*548-(548-h*scale)/2)/scale;
 if(x<0||x>200||y<55||y>h)return null;const row=Math.round((y-77)/45);if(Math.abs(y-(77+row*45))>21)return null;
 const targets:Record<number,number>={0:0,1:1,2:8,3:7,4:4,6:6,7:2,9:3,15:5};return targets[row]??null;
}
