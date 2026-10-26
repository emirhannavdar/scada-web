import {hash} from './security-core.mjs';
/** Additive, idempotent migration; content and user records are preserved. */
export async function initializeSecuritySchema(db){
 await db.transaction(async()=>{
  await db.exec(`CREATE TABLE IF NOT EXISTS security_mfa(user_id INTEGER PRIMARY KEY REFERENCES cms_users(id) ON DELETE CASCADE,enabled INTEGER NOT NULL DEFAULT 0,secret TEXT,pending_secret TEXT,pending_until INTEGER NOT NULL DEFAULT 0,recovery TEXT NOT NULL DEFAULT '[]',last_counter INTEGER NOT NULL DEFAULT -1);
CREATE TABLE IF NOT EXISTS security_challenges(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,password_hash TEXT NOT NULL,expires INTEGER NOT NULL,ip TEXT NOT NULL,agent TEXT NOT NULL,tries INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS security_devices(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,password_hash TEXT NOT NULL,factor_hash TEXT NOT NULL,ip TEXT NOT NULL,agent TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS security_devices_expires ON security_devices(expires);
CREATE TABLE IF NOT EXISTS security_attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS security_events(id INTEGER PRIMARY KEY AUTOINCREMENT,created INTEGER NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,result TEXT NOT NULL,ip TEXT NOT NULL,agent TEXT NOT NULL,detail TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS security_events_created ON security_events(created,id);
CREATE INDEX IF NOT EXISTS security_challenges_expires ON security_challenges(expires);`);
  const deviceColumns=await db.prepare('PRAGMA table_info(security_devices)').all();if(!deviceColumns.some(c=>c.name==='logout_grant'))await db.exec('ALTER TABLE security_devices ADD COLUMN logout_grant INTEGER NOT NULL DEFAULT 0');
  const columns=await db.prepare('PRAGMA table_info(sessions)').all();
  for(const [name,type] of [['created_at','INTEGER NOT NULL DEFAULT 0'],['last_seen','INTEGER NOT NULL DEFAULT 0'],['reauth_at','INTEGER NOT NULL DEFAULT 0'],['mfa_verified','INTEGER NOT NULL DEFAULT 0'],['mfa_fingerprint',"TEXT NOT NULL DEFAULT ''"],['ip',"TEXT NOT NULL DEFAULT ''"],['agent',"TEXT NOT NULL DEFAULT ''"]])if(!columns.some(c=>c.name===name))await db.exec('ALTER TABLE sessions ADD COLUMN '+name+' '+type);
  const now=Date.now();await db.prepare('UPDATE sessions SET created_at=expires-?,last_seen=? WHERE created_at=0').run(8*3600000,now);
  const verified=await db.prepare("SELECT s.token,m.secret FROM sessions s JOIN cms_users u ON u.email=s.email JOIN security_mfa m ON m.user_id=u.id WHERE s.mfa_verified=1 AND s.mfa_fingerprint='' AND m.enabled=1").all();for(const row of verified)await db.prepare('UPDATE sessions SET mfa_fingerprint=? WHERE token=?').run(hash(row.secret),row.token);
  await db.prepare('UPDATE sessions SET expires=0 WHERE expires>?').run(now);
 });
}
