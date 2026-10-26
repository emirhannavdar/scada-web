import {useState} from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {AuthCode,AuthPassword} from '@/components/admin/AuthFields';
afterEach(cleanup);
function CodeForm({submit,ready=true}:{submit:()=>void;ready?:boolean}){const [value,setValue]=useState('');return <form onSubmit={event=>{event.preventDefault();submit()}}><AuthCode value={value} onChange={setValue} ready={ready}/><button>Doğrula</button></form>}
it('submits exactly once on six digits and waits for an edit before trying a failed code again',async()=>{
 const submit=vi.fn();render(<CodeForm submit={submit}/>);const input=screen.getByLabelText('6 haneli doğrulama kodu');expect(document.querySelectorAll('.auth-code-cells>span')).toHaveLength(6);fireEvent.change(input,{target:{value:'12345'}});expect(submit).not.toHaveBeenCalled();fireEvent.change(input,{target:{value:'123456'}});await waitFor(()=>expect(submit).toHaveBeenCalledTimes(1));fireEvent.change(input,{target:{value:'123456'}});expect(submit).toHaveBeenCalledTimes(1);fireEvent.change(input,{target:{value:'654321'}});await waitFor(()=>expect(submit).toHaveBeenCalledTimes(2));
});
it('accepts pasted codes and does not submit a recovery code automatically',async()=>{
 const submit=vi.fn();render(<CodeForm submit={submit}/>);fireEvent.change(screen.getByLabelText('6 haneli doğrulama kodu'),{target:{value:'123 456'}});await waitFor(()=>expect(submit).toHaveBeenCalledTimes(1));fireEvent.click(screen.getByRole('button',{name:'Kurtarma kodu kullan'}));expect(document.querySelectorAll('.auth-code-cells>span')).toHaveLength(5);fireEvent.change(screen.getByLabelText('Tek kullanımlık kurtarma kodu'),{target:{value:'2CF0-B2C2-0926-DD53-5AA6'}});expect(submit).toHaveBeenCalledTimes(1);fireEvent.click(screen.getByRole('button',{name:'Doğrula',exact:true}));expect(submit).toHaveBeenCalledTimes(2);
});
it('waits until the required password is present',async()=>{
 const submit=vi.fn();const {rerender}=render(<CodeForm submit={submit} ready={false}/>);fireEvent.change(screen.getByLabelText('6 haneli doğrulama kodu'),{target:{value:'123456'}});expect(submit).not.toHaveBeenCalled();rerender(<CodeForm submit={submit} ready/>);await waitFor(()=>expect(submit).toHaveBeenCalledTimes(1));
});
it('toggles password visibility without submitting or changing the password',()=>{
 const submit=vi.fn();function Form(){const [password,setPassword]=useState('private');return <form onSubmit={submit}><AuthPassword value={password} onChange={setPassword}/></form>}render(<Form/>);const input=screen.getByLabelText('Şifre');expect(input).toHaveAttribute('type','password');fireEvent.click(screen.getByRole('button',{name:'Şifreyi göster'}));expect(input).toHaveAttribute('type','text');expect(input).toHaveValue('private');expect(submit).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Şifreyi gizle'}));expect(input).toHaveAttribute('type','password');
});
