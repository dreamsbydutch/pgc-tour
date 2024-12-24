import AdminNameChangeForm from "./_components/NameChangeForm";
import PaymentForm from "./_components/TransactionForm";

export default async function AdminDashboard() {
  return (
    <>
      <AdminNameChangeForm />
      <PaymentForm />
    </>
  );
}
