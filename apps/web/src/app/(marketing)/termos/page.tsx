import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de uso — Bethel",
  description: "Condições simples para usar o Bethel.",
};

export default function TermosPage() {
  return (
    <article className="legal-page">
      <h1>Termos de uso</h1>
      <p>
        O Bethel é um sistema de gestão do lar para famílias. Ao criar uma conta, você concorda em usar o espaço com
        respeito e só cadastrar informações da sua própria casa.
      </p>
      <h2>Conta e família</h2>
      <p>
        Você é responsável pelo e-mail e pela senha. Quem cria a família é o dono do espaço e pode convidar ou remover
        membros. Não compartilhe o link de convite com quem não faz parte da casa.
      </p>
      <h2>Conteúdo</h2>
      <p>
        Finanças, orações e o restante do que vocês escrevem são da família. O Bethel não substitui conselho financeiro,
        jurídico ou pastoral. Use o sistema como um caderno compartilhado.
      </p>
      <h2>Disponibilidade</h2>
      <p>
        Este lançamento usa planos gratuitos de hospedagem e banco de dados. Pode haver pausas para manutenção. Não há
        garantia de funcionamento ininterrupto.
      </p>
    </article>
  );
}
