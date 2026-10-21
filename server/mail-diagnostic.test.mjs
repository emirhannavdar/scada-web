import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mailDiagnostic} from './mail.mjs';
test('root diagnostics explain SMTP codes without returning response text or AUTH credentials',()=>{
 const secret='secret-password-and-auth-data';
 const auth=mailDiagnostic({code:'EAUTH',responseCode:535,command:'AUTH PLAIN '+secret,response:secret,message:secret});
 assert.match(auth.message,/EAUTH \/ 535 \/ AUTH/);assert.ok(!auth.message.includes(secret));assert.equal(auth.status,502);
 assert.match(mailDiagnostic({code:'ESOCKET',message:'self signed certificate '+secret}).message,/sertifikası/);
 assert.match(mailDiagnostic({code:'ETIMEDOUT',message:secret}).message,/zaman aşımına/);
 assert.ok(!mailDiagnostic({code:secret,command:secret,response:secret,message:secret}).message.includes(secret));
});
