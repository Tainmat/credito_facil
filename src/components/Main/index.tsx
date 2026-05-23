const Main = ({
  sub = 'Serviços inteligentes',
  description = 'A solução certa para a sua empresa'
}) => (
  <main className="bg-[#06092b] text-white w-full h-full p-12 text-center flex flex-col items-center justify-center">
    <img
      src="/img/bilgi-logo.svg"
      alt="Logo da Bilgi"
      className="w-[25rem] mb-10"
    />
    <h2 className="text-[2rem] font-light">{sub}</h2>
    <h2 className="text-[4rem] font-bold">{description}</h2>
    <img
      src="/img/planejamento-img.svg"
      alt="Um homem e uma mulher analizando gráficos"
      className="mt-12 w-[min(30rem,100%)]"
    />
  </main>
)

export default Main
