import ts from 'typescript';
const displayNames=new Set(['label','title','text','lead','eyebrow','placeholder','heading','description','caption','body','summary','tagline','name','t','d','aria-label']);
const translators=new Set(['t','_tx','translate']);
/** Limits collection to display copy; routes, CSS, form keys and protocol identifiers stay fixed. */
export function visibleLiteral(node,source){
 if(!(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)))return false;
 const text=node.text.trim();if(!text||!/\p{L}/u.test(text)||/^(\/|https?:|mailto:|tel:|#[a-z])/i.test(text)||['tr','en','TR','EN'].includes(text))return false;
 const parent=node.parent;
 if(ts.isJsxAttribute(parent))return parent.name.getText(source)!=='name'&&displayNames.has(parent.name.getText(source));
 if(ts.isPropertyAssignment(parent)&&displayNames.has(parent.name.getText(source)))return parent.name.getText(source)!=='name'||!/^([a-z][a-zA-Z0-9:_-]*)$/.test(text);
 if(ts.isBinaryExpression(parent)&&[ts.SyntaxKind.EqualsEqualsToken,ts.SyntaxKind.EqualsEqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsToken,ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(parent.operatorToken.kind))return false;
 let ancestor=parent;while(ancestor&&!ts.isStatement(ancestor)){
  if(ts.isJsxAttribute(ancestor))return false;
  if(ts.isCallExpression(ancestor))return translators.has(ancestor.expression.getText(source));
  ancestor=ancestor.parent;
 }
 return false;
}
