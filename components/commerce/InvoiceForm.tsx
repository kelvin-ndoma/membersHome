"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Plus, Trash2 } from "lucide-react"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be 0 or greater"),
  total: z.number(),
})

const invoiceSchema = z.object({
  membershipId: z.string().min(1, "Please select a member"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.string().default("USD"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  members: Array<{ id: string; user: { name: string; email: string } }>
  onSubmit: (data: InvoiceFormData) => Promise<void>
  isLoading?: boolean
}

export function InvoiceForm({ members, onSubmit, isLoading = false }: InvoiceFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      membershipId: "",
      description: "",
      dueDate: "",
      currency: "USD",
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  })

  const items = watch("items")

  const calculateTotal = (index: number) => {
    const quantity = items[index]?.quantity || 0
    const unitPrice = items[index]?.unitPrice || 0
    const total = quantity * unitPrice
    setValue(`items.${index}.total`, total)
    return total
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="membershipId">Customer *</Label>
        <Select onValueChange={(value) => setValue("membershipId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a member" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.user.name} ({member.user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.membershipId && (
          <p className="text-sm text-red-500">{errors.membershipId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" {...register("description")} rows={2} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select defaultValue="USD" onValueChange={(value) => setValue("currency", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Invoice Items</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", quantity: 1, unitPrice: 0, total: 0 })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {errors.items && (
          <p className="text-sm text-red-500">{errors.items.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Item {index + 1}</span>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-8 w-8 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Description"
                    {...register(`items.${index}.description`)}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-xs text-red-500">{errors.items[index]?.description?.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Quantity"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    onChange={(e) => {
                      register(`items.${index}.quantity`).onChange(e)
                      calculateTotal(index)
                    }}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    onChange={(e) => {
                      register(`items.${index}.unitPrice`).onChange(e)
                      calculateTotal(index)
                    }}
                  />
                </div>
              </div>
              <div className="mt-2 text-right text-sm">
                Total: {watch(`items.${index}.total`)?.toFixed(2) || "0.00"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-muted p-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Total Amount:</span>
          <span>{watch("currency")} {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Invoice"}
      </Button>
    </form>
  )
}