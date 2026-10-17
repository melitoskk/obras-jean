// Wordmark em duas linhas, Montserrat. "carvalho" define a largura do bloco e "rosa"
// se espalha pra bater com ela - flex + space-between resolve isso sem letter-spacing
// chutado, e continua certo se a fonte ou o corpo mudarem.
export default function Logo() {
  return (
    <span className="inline-block font-marca leading-none uppercase">
      {/* ponytail: "rosa" só pode crescer até a largura natural dela caber em "carvalho" -
          passando disso o justify-between estoura. Hoje sobra folga. */}
      <span className="block text-[15px] font-semibold tracking-[.06em]">carvalho</span>
      <span className="mt-1 flex justify-between text-[22px] text-laranja">
        {[...'rosa'].map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </span>
    </span>
  )
}
