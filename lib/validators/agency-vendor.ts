import { z } from "zod";

export const agencyVendorSchema = z.object({
  name: z.string().min(1, "Введите имя").max(200),
  service: z.string().min(1, "Укажите услугу").max(120),
  contact: z.string().max(300).optional().or(z.literal("")),
  link: z.string().max(500).optional().or(z.literal("")),
  priceNote: z.string().max(200).optional().or(z.literal("")),
});
export type AgencyVendorInput = z.infer<typeof agencyVendorSchema>;
