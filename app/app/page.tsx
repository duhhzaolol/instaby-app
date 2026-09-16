import { redirect } from "next/navigation";

// Entrada do sistema administrativo. A proteção de verdade continua sendo o
// middleware (autenticação/autorização) em cima de /dashboard — essa rota é só
// um endereço mais curto e memorável pra chegar lá.
export default function AppEntry() {
  redirect("/dashboard");
}
