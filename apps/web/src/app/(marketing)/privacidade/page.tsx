import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidade — Bethel",
  description: "Como o Bethel trata os dados da sua família.",
};

export default function PrivacidadePage() {
  return (
    <article className="legal-page">
      <h1>Privacidade</h1>
      <p>
        O Bethel guarda as informações que a sua família cadastra — contas, tarefas, orações e o restante da vida do lar
        — para que vocês usem o sistema. Não vendemos esses dados e não usamos anúncios.
      </p>
      <h2>O que guardamos</h2>
      <p>
        Nome, e-mail e senha da conta (a senha fica criptografada). Tudo o que vocês registram no painel da família
        fica ligado só àquela família.
      </p>
      <h2>Quem vê</h2>
      <p>
        Somente as pessoas convidadas para a sua família. Cada casa é um espaço separado. Quem cuida da operação do
        Bethel acessa o banco só para manter o serviço funcionando ou corrigir problemas.
      </p>
      <h2>Sair e apagar</h2>
      <p>
        Um membro pode sair da família pelo menu da casa. Quem é dono pode encerrar o espaço — isso apaga os dados
        daquela família.
      </p>
    </article>
  );
}
