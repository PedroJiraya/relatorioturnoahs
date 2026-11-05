import './globals.css';

export const metadata = {
  title: 'Relatório de manutenção corretiva',
  description: 'Relatório de turno de manutenção corretiva.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
