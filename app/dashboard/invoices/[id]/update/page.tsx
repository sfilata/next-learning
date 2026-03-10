import { fetchCustomers, fetchInvoiceById } from "@/app/lib/data";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import EditInvoiceForm from "@/app/ui/invoices/edit-form";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [invoice, customers] = await Promise.all([fetchInvoiceById(id), fetchCustomers()])

  return <main>
    <Breadcrumbs breadcrumbs={[
      { label: 'Invoices', href: '/dashboard/invoices' },
      { label: `Update Invoice`, href: `/dashboard/invoices/${id}/update`, active: true },
    ]}>
    </Breadcrumbs>
    <EditInvoiceForm invoice={invoice} customers={customers} />
  </main>
}