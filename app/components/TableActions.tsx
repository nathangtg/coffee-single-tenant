import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
    onEdit: () => void;
    onDelete: () => void;
}

const TableActions: React.FC<Props> = ({ onEdit, onDelete }) => {
    return (
        <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default TableActions;
