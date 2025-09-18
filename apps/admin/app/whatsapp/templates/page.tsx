"use client";

import { useQuery } from "@tanstack/react-query";
import { TemplatesTable, Template } from "@/components/templates-table";

async function fetchTemplates(): Promise<Template[]> {
    const res = await fetch("http://localhost:32101/api/whatsapp/templates");
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Fetch error:', res.status, errorText);
        throw new Error(`Failed to fetch templates: ${res.status} ${errorText}`);
    }
    return res.json();
}



export default function TemplatesPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["whatsapp-templates"],
        queryFn: fetchTemplates,
    });

    if (isLoading) return <p>Loading...</p>;
    if (error instanceof Error) return <p>Error: {error.message}</p>;

    return (
        <div className="p-6 space-y-4">
            <TemplatesTable data={data ?? []} />
        </div>
    );
}

