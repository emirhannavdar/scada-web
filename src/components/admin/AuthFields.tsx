import {useEffect,useId,useRef,useState} from 'react';
import {Eye,EyeOff} from 'lucide-react';
import './security.css';

export function AuthPassword({value,onChange,disabled=false}:{value:string;onChange:(value:string)=>void;disabled?:boolean}){
 const [visible,setVisible]=useState(false),id=useId();
 return <div className="auth-field"><label htmlFor={id}>Şifre</label><div className="auth-password"><input id={id} aria-label="Şifre" type={visible?'text':'password'} autoComplete="current-password" required maxLength={256} value={value} disabled={disabled} onChange={event=>onChange(event.target.value)}/><button type="button" className="auth-visibility" aria-label={visible?'Şifreyi gizle':'Şifreyi göster'} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></div>;
}

export type FactorType='totp'|'recovery';
export function AuthCode({value,onChange,busy=false,ready=true,label='6 haneli doğrulama kodu',allowRecovery=true,type,onTypeChange}:{value:string;onChange:(value:string)=>void;busy?:boolean;ready?:boolean;label?:string;allowRecovery?:boolean;type?:FactorType;onTypeChange?:(type:FactorType)=>void}){
 const [localType,setLocalType]=useState<FactorType>('totp'),id=useId(),input=useRef<HTMLInputElement>(null),submitted=useRef(''),[cursor,setCursor]=useState(0),[focused,setFocused]=useState(false);
 const recovery=(type??localType)==='recovery',digits=value.replace(/[^a-f0-9]/gi,'').toUpperCase(),groups=recovery?5:6;
 useEffect(()=>{
  if(recovery||!/^\d{6}$/.test(value)){submitted.current='';return}
  if(busy||!ready||submitted.current===value)return;
  submitted.current=value;input.current?.form?.requestSubmit();
 },[value,recovery,busy,ready]);
 function change(raw:string){const clean=recovery?raw.replace(/[^a-f0-9]/gi,'').toUpperCase().slice(0,20):raw.replace(/\D/g,'').slice(0,6);onChange(recovery?(clean.match(/.{1,4}/g)||[]).join('-'):clean)}
 return <div className="auth-field auth-code-field"><label htmlFor={id}>{recovery?'Tek kullanımlık kurtarma kodu':label}</label><div className={'auth-code-boxes '+(recovery?'is-recovery':'')+(focused?' is-focused':'')}>
 <div className="auth-code-cells" aria-hidden="true">{Array.from({length:groups},(_,index)=><span key={index} className={(digits.length>index*(recovery?4:1)?'has-value ':'')+(focused&&index===Math.min(groups-1,recovery?Math.floor(cursor/5):cursor)?'is-current':'')}>{recovery?digits.slice(index*4,index*4+4):digits[index]||''}</span>)}</div>
 <input ref={input} id={id} autoFocus type="text" inputMode={recovery?'text':'numeric'} autoComplete={recovery?'off':'one-time-code'} autoCapitalize="characters" spellCheck={false} required minLength={recovery?24:6} maxLength={recovery?24:6} pattern={recovery?'[A-Fa-f0-9]{4}(-[A-Fa-f0-9]{4}){4}':'[0-9]{6}'} value={value} disabled={busy} onChange={event=>change(event.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onSelect={event=>setCursor(event.currentTarget.selectionStart??value.length)}/></div>
 {recovery&&<p className="auth-field-help">Her kurtarma kodu yalnızca bir kez kullanılabilir.</p>}{allowRecovery&&<button type="button" className="auth-mode" disabled={busy} onClick={()=>{const next=recovery?'totp':'recovery';setLocalType(next);onTypeChange?.(next);onChange('');submitted.current='';queueMicrotask(()=>input.current?.focus())}}>{recovery?'Authenticator kodu kullan':'Kurtarma kodu kullan'}</button>}</div>;
}
