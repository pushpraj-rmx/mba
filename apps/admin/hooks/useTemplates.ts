import { useQuery } from "@tanstack/react-query";

export type Template = {
    id: number;
    name: string;
    body: string;
};

async function fetchTemplates(): Promise<Template[]> {
    const res = await fetch("/api/whatsapp/templates");
    if (!res.ok) throw new Error("Failed to fetch templates");
    return res.json();
}

export function useTemplates() {
    return useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });
}
