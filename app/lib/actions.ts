'use server';

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import z from "zod";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
}

export async function createInvoice(prevState: State, formData: FormData) {
  const rawFormData: { [key: string]: FormDataEntryValue } = {}
  for (const [key, value] of formData.entries()) {
    rawFormData[key] = value;
  }

  const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({ required_error: 'Please select a customer.' }),
    amount: z.coerce.number().gt(0, { message: 'Amount must be greater than 0.' }),
    status: z.enum(['pending', 'paid'], { required_error: 'Please select an invoice status.' }),
    date: z.string()
  });

  const CreateInvoice = FormSchema.omit({ id: true, date: true });

  const validatedFields = CreateInvoice.safeParse({
    customerId: rawFormData.customerId,
    amount: rawFormData.amount,
    status: rawFormData.status
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.'
    }
  }

  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    return {
      message: 'Database Error. Failed to Create Invoice.',
    }
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  const rawFormData: { [key: string]: FormDataEntryValue } = {}
  for (const [key, value] of formData.entries()) {
    rawFormData[key] = value;
  }

  const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({ invalid_type_error: 'Please select a customer.' }),
    amount: z.coerce.number().gt(0, { message: 'Amount must be greater than 0.' }),
    status: z.enum(['pending', 'paid'], { invalid_type_error: 'Please select an invoice status.' }),
    date: z.string()
  });

  const UpdateInvoice = FormSchema.omit({ id: true, date: true });

  const validatedFields = UpdateInvoice.safeParse({
    customerId: rawFormData.customerId,
    amount: rawFormData.amount,
    status: rawFormData.status,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.'
    }
  }

  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}, date = ${date}
    WHERE id = ${id}
  `;
  } catch (error) {
    return { message: 'Database Error. Failed to Update Invoice.' };
  }

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

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid email or password. Please try again.';
        default:
          return 'An unexpected error occurred during sign in. Please try again.';
      }
    }

    throw error;
  }
}

export async function logout(prevState: string | undefined, formData: FormData) {
  try {
    await signOut({ redirectTo: '/login' });
  } catch (error) {
    throw new Error('An unexpected error occurred during sign out. Please try again.');
  }
}