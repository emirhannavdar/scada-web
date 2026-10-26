import {useEffect,useId,useRef,useState} from 'react';
import {Eye,EyeOff} from 'lucide-react';
import './security.css';

export function AuthPassword({value,onChange,disabled=false}:{value:string;onChange:(value:string)=>void;disabled?:boolean}){
 const [visible,setVisible]=useState(false),id=useId();
 return <div className="auth-field"><label htmlFor={id}>Şifre</label><div className="auth-password"><input id={id} aria-label="Şifre" type={visible?'text':'password'} autoComplete="current-password" required maxLength={256} value={value} disabled={disabled} onChange={event=>onChange(event.target.value)}/><button type="button" className="auth-visibility" aria-label={visible?'Şifreyi gizle':'Şifreyi göster'} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></div>;
}

export function AuthCode({value,onChange,busy=false,ready=true,label='6 haneli doğrulama kodu',allowRecovery=true}:{value:string;onChange:(value:string)=>void;busy?:boolean;ready?:boolean;label?:string;allowRecovery?:boolean}){
 const [recovery,setRecovery]=useState(false),id=useId(),input=useRef<HTMLInputElement>(null),submitted=useRef('');
 useEffect(()=>{
  if(recovery||!/^\d{6}$/.test(value)){submitted.current='';return}
  if(busy||!ready||submitted.current===value)return;
  submitted.current=value;input.current?.form?.requestSubmit();
 },[value,recovery,busy,ready]);
 return <div className="auth-field auth-code-field"><label htmlFor={id}>{recovery?'Tek kullanımlık kurtarma kodu':label}</label><input ref={input} id={id} className={recovery?'auth-recovery':'auth-otp'} type="text" inputMode={recovery?'text':'numeric'} autoComplete={recovery?'off':'one-time-code'} autoCapitalize="none" spellCheck={false} required minLength={recovery?undefined:6} maxLength={recovery?40:6} pattern={recovery?undefined:'[0-9]{6}'} value={value} disabled={busy} onChange={event=>onChange(recovery?event.target.value.trim():event.target.value.replace(/\D/g,'').slice(0,6))} aria-describedby={id+'-help'}/><p id={id+'-help'} className="auth-field-help">{recovery?'Sakladığınız kurtarma kodlarından birini girip doğrulayın. Her kod yalnızca bir kez kullanılabilir.':'Uygulamanızdaki kodu girin. Altıncı rakamda otomatik doğrulanır.'}</p>{allowRecovery&&<button type="button" className="auth-mode" disabled={busy} onClick={()=>{setRecovery(!recovery);onChange('');submitted.current='';queueMicrotask(()=>input.current?.focus())}}>{recovery?'Authenticator kodu kullan':'Kurtarma kodu kullan'}</button>}</div>;
}
