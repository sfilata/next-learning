import { fetchFilteredCustomers } from "@/app/lib/data";
import CustomersTable from "@/app/ui/customers/table";
import { lusitana } from "@/app/ui/fonts";
import Pagination from "@/app/ui/invoices/pagination";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import { Suspense } from "react";

export default async function Page(props: { searchParams: Promise<{ query?: string; currentPage?: number }> }) {
    const { query = '', currentPage = 1 } = await props.searchParams;
    const filteredCustomers = await fetchFilteredCustomers(query);
    const totalPages = await fetchFilteredCustomers(query);

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Customers</h1>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
            </div>
            <div className="mt-5 flex w-full justify-center">
                <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
                    <CustomersTable customers={filteredCustomers} />
                </Suspense>
            </div>
        </div>
    );
}