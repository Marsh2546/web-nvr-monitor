import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight 
} from "lucide-react";
import { PaginationProps } from "@/app/types/common";

interface Props extends PaginationProps {
  label?: string;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  itemsPerPage, 
  totalItems, 
  onPageChange, 
  onItemsPerPageChange,
  label = "รายการ"
}: Props) {
  if (totalItems === 0) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Items per page */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">แสดง:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(parseInt(value, 10))}
            >
              <SelectTrigger className="w-24 bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{label}/หน้า</span>
          </div>

          {/* Page info */}
          <div className="text-sm text-muted-foreground">
            แสดง {startItem.toLocaleString()} - {endItem.toLocaleString()} จาก{" "}
            {totalItems.toLocaleString()} {label}
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="bg-background border-border text-foreground"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="bg-background border-border text-foreground"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">หน้า</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    onPageChange(page);
                  }
                }}
                className="w-16 text-center bg-background border-border text-foreground"
              />
              <span className="text-sm text-muted-foreground">/ {totalPages}</span>
            </div>

            <Button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="bg-background border-border text-foreground"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="bg-background border-border text-foreground"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
