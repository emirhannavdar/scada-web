import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Activity, Cpu, Radio } from 'lucide-react';
import { translate as tx, useLocale } from '@/lib/i18n';
import { useState } from 'react';
import './mobile-home.css';

export function MobileHomeHero() {
  useLocale();
  const [platform,setPlatform] = useState<'mobile'|'web'>('web');
  return <section id="enerji" className="mobile-home-hero" data-cms-section="mobile-introduction">
    <div className="mobile-home-grid" aria-hidden="true" />
    <div className="mobile-home-copy">
      <p className="mobile-home-eyebrow">SCADAWATT / {tx('YAZILIM & ELEKTRONİK')}</p>
      <h1>{tx('Sahanızla')}<br/><em>{tx('bağlantıda kalın.')}</em></h1>
      <p className="mobile-home-description">{tx('Sahadan gelen veriyi anlamlı bilgiye dönüştürün. SCADA, uzaktan izleme ve enerji yönetimini tek bir ekosistemde keşfedin.')}</p>
      <div className="mobile-home-actions"><Link to="/cozumler">{tx('Çözümleri keşfedin')}<ArrowUpRight size={18}/></Link><Link to="/iletisim" search={{tur:'demo'}}>{tx('Demo talebi')}<ArrowUpRight size={17}/></Link></div>
    </div>
    <div id="teknoloji" className="mobile-platform-card" data-platform={platform}>
      <div className="mobile-platform-caption"><span>SCADAWATT</span><span>{tx('Sahadan ekrana')}</span></div>
      <div className="mobile-platform-switch" role="group" aria-label={tx('ScadaWatt uygulamaları')}><button type="button" aria-pressed={platform==='mobile'} onClick={()=>setPlatform('mobile')}>{tx('Mobil uygulama')}</button><button type="button" aria-pressed={platform==='web'} onClick={()=>setPlatform('web')}>{tx('Web arayüzü')}</button></div>
      <div className="mobile-platform-screen"><img key={platform} src={platform==='mobile'?'/assets/app.webp':'/assets/screens/monitor-dashboard-1.png'} alt={tx(platform==='mobile'?'ScadaWatt mobil uygulaması':'ScadaWatt izleme arayüzü')} fetchPriority="high"/></div>
      <div className="mobile-platform-path"><span><Radio size={17}/>{tx('Saha')}</span><i/><span><Cpu size={17}/>{tx('Donanım')}</span><i/><span><Activity size={17}/>{tx('Yazılım')}</span></div>
    </div>
    <div className="mobile-home-bottom"><span>{tx('Görünür veri. Bilinçli kararlar.')}</span><a href="#donanim">{tx('Devamını keşfedin')} ↓</a></div>
  </section>;
}
