'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import z from "zod";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function createInvoice(formData: FormData) {
  const rawFormData: { [key: string]: FormDataEntryValue } = {}
  for (const [key, value] of formData.entries()) {
    rawFormData[key] = value;
  }

  const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
  });

  const CreateInvoice = FormSchema.omit({ id: true, date: true });

  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: rawFormData.customerId,
    amount: rawFormData.amount,
    status: rawFormData.status
  });

  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split('T')[0];

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const rawFormData: { [key: string]: FormDataEntryValue } = {}
  for (const [key, value] of formData.entries()) {
    rawFormData[key] = value;
  }

  const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
  });

  const UpdateInvoice = FormSchema;

  const { customerId, amount, status } = UpdateInvoice.omit({ id: true, date: true }).parse({
    customerId: rawFormData.customerId,
    amount: rawFormData.amount,
    status: rawFormData.status,
  });

  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split('T')[0];

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}, date = ${date}
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
}