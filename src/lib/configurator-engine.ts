import {type ConfiguratorDefinition,type ConfigQuestion,type Answer,type Bilingual} from '../../shared/configurator.mjs';
export {parseConfigurator,validateConfigurator,defaultConfigurator,CONFIGURATOR_FIELD} from '../../shared/configurator.mjs';
export type {ConfiguratorDefinition,ConfigQuestion,QuestionOption,Answer,Bilingual} from '../../shared/configurator.mjs';
export type Answers=Record<string,Answer>;
export const configText=(value:Bilingual,language:'tr'|'en')=>value[language]||value.tr;
export function answerFor(question:ConfigQuestion,answers:Answers):Answer{
 const raw=answers[question.id]??question.defaultValue;
 if(question.type==='multi')return (Array.isArray(raw)?raw:typeof raw==='string'&&raw?[raw]:[]).filter(id=>question.options.some(o=>o.id===id));
 if(question.type==='checkbox')return raw===true;
 if(question.type==='single'||question.type==='select'){const value=Array.isArray(raw)?raw[0]??'':String(raw);return question.options.some(o=>o.id===value)?value:''}
 if(question.type==='number')return typeof raw==='number'&&Number.isFinite(raw)?raw:typeof raw==='string'?raw:'';
 return typeof raw==='string'?raw:'';
}
export function selectedOptions(question:ConfigQuestion,answers:Answers){if(!['single','multi','select','checkbox'].includes(question.type))return [];const value=answerFor(question,answers);return question.options.filter((opt,index)=>question.type==='checkbox'?value===true&&index===0:Array.isArray(value)?value.includes(opt.id):value===opt.id)}
export function visibleQuestions(definition:ConfiguratorDefinition,answers:Answers){
 const visible:ConfigQuestion[]=[];for(const question of definition.questions){if(!question.enabled)continue;if(question.when){const parent=visible.find(q=>q.id===question.when!.question);if(!parent||!selectedOptions(parent,answers).some(o=>o.id===question.when!.option))continue;}visible.push(question);}return visible;
}
export function answerError(question:ConfigQuestion,answers:Answers):string|null{
 const value=answerFor(question,answers),empty=value===''||value===false||(Array.isArray(value)&&!value.length);
 if(empty)return question.required?'required':null;
 if(question.type==='number'){const number=Number(value);if(!Number.isFinite(number)||question.integer&&!Number.isInteger(number))return 'number';if(question.min!==undefined&&number<question.min||question.max!==undefined&&number>question.max)return 'range'}
 if(question.type==='text'&&(String(value).length>(question.maxLength??4000)||String(value).length<(question.minLength??0)))return 'length';
 if(question.type==='multi'&&Array.isArray(value)){if(question.minChoices!==undefined&&value.length<question.minChoices)return 'choices';if(question.maxChoices!==undefined&&value.length>question.maxChoices)return 'choices'}
 return null;
}
export function answerLabel(question:ConfigQuestion,answers:Answers,language:'tr'|'en'){
 const options=selectedOptions(question,answers);
 if(options.length)return options.map(o=>configText(o.label,language)).join(', ');
 const value=answerFor(question,answers);
 if(value===false||value==='')return language==='tr'?'Belirtilmedi':'Not specified';
 return Array.isArray(value)?value.join(', '):String(value);
}
export function configuredScope(definition:ConfiguratorDefinition,answers:Answers){
 const questions=visibleQuestions(definition,answers),solutions=new Set(definition.baseSolutions),hardware=new Set(definition.baseHardware);
 for(const q of questions)for(const option of selectedOptions(q,answers)){option.solutions.forEach(id=>solutions.add(id));option.hardware.forEach(id=>hardware.add(id))}
 return {questions,solutions:[...solutions],hardware:[...hardware]};
}
export function buildConfigBrief(definition:ConfiguratorDefinition,answers:Answers,language:'tr'|'en',solutionLabels:string[]){
 const {questions}=configuredScope(definition,answers);
 return [(language==='tr'?'Merhaba ScadaWatt ekibi,':'Hello ScadaWatt team,'),'',configText(definition.resultIntro,language),'',...questions.map(q=>configText(q.label,language)+': '+answerLabel(q,answers,language)),...(solutionLabels.length?['',language==='tr'?'İlgilendiğim çözümler:':'Solutions of interest:',...solutionLabels.map(label=>'• '+label)]:[]),'',configText(definition.notice,language)].join('\n');
}
