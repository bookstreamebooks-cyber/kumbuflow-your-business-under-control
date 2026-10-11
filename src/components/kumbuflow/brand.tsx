import logo from '@/assets/kumbuflow-logo.asset.json'
export function Brand({compact=false}:{compact?:boolean}){return <a className={`brand ${compact?'brand-compact':''}`} href="/" aria-label="KumbuFlow — O teu negócio, sob controlo."><span className="brand-symbol"><img src={logo.url} alt="" /></span><span className="brand-name">Kumbu<span>Flow</span></span></a>}
