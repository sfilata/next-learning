import { fetchFilteredCustomers } from "@/app/lib/data";
import CustomersTable from "@/app/ui/customers/table";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: 'Customers'
};

export default async function Page(props: { searchParams: Promise<{ query?: string; currentPage?: number }> }) {
    const { query = '', currentPage = 1 } = await props.searchParams;
    const filteredCustomers = await fetchFilteredCustomers(query);

    return (
        <div className="w-full">
            <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
                <CustomersTable customers={filteredCustomers} />
            </Suspense>
        </div>
    );
}