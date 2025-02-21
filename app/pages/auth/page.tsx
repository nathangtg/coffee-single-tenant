import AuthForms from "@/app/components/ui/AuthForms";
import Header from "@/app/components/ui/header";

export default function Page() {
    return (
        <div>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <AuthForms />
            </div>
        </div>
    )
}