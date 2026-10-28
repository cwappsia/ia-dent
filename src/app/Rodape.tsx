import { Link } from 'react-router-dom'

export default function Rodape() {
  const ano = new Date().getFullYear()
  return (
    <footer className="mt-10 border-t border-borda pb-4 pt-4 text-xs text-suave">
      <p>
        © {ano} CW IA Apps — Tecnologia sob medida para pequenas e médias empresas acelerarem operações.{' '}
        <a href="https://cwiaapps.tech" target="_blank" rel="noreferrer" className="underline hover:text-texto">
          cwiaapps.tech
        </a>
      </p>
      <p className="mt-1 flex gap-3">
        <Link to="/privacidade" className="underline hover:text-texto">
          Privacidade
        </Link>
        <Link to="/termos" className="underline hover:text-texto">
          Termos de uso
        </Link>
      </p>
    </footer>
  )
}
