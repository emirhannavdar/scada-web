export const DEVICE_KEY='@devices';
export function checkDevice(value){if(value===undefined||value===null||value==='')return undefined;if(value!=='desktop'&&value!=='mobile')throw Object.assign(Error('Geçersiz ekran türü.'),{status:400});return value}
export function deviceContent(raw,device){const slot=device&&raw[DEVICE_KEY]?.[device];return slot?{...slot.values,'@collections':slot.collections,'@design':slot.design}:raw}
