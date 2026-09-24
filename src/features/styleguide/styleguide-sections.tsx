"use client";

/**
 * Dev-only kitchen sink: every UI kit component in one place, so the designer's
 * work can be compared piece by piece. Its copy is intentionally not in /src/content.
 */
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  DatePicker,
  DropdownMenu,
  EmptyState,
  ErrorState,
  FieldGroup,
  FormField,
  Input,
  Media,
  Modal,
  Pagination,
  RadioGroup,
  Section,
  Select,
  Skeleton,
  Spinner,
  Stepper,
  StarRating,
  StarRatingInput,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TimeSelect,
  useToast,
  type BadgeVariant,
  type ButtonSize,
  type ButtonVariant,
  type SortDirection,
} from "@/components/ui";
import { formatCurrency } from "@/lib/currency";

const colorSwatches = [
  ["background", "bg-background text-foreground"],
  ["surface", "bg-surface text-foreground"],
  ["surface-muted", "bg-surface-muted text-foreground"],
  ["card", "bg-card text-foreground"],
  ["field", "bg-field text-foreground"],
  ["foreground", "bg-foreground text-background"],
  ["muted", "bg-muted text-background"],
  ["border", "bg-border text-foreground"],
  ["border-strong", "bg-border-strong text-background"],
  ["primary", "bg-primary text-primary-foreground"],
  ["secondary", "bg-secondary text-secondary-foreground"],
  ["accent", "bg-accent text-accent-foreground"],
  ["price", "bg-price text-background"],
  ["link", "bg-link text-background"],
  ["success", "bg-success text-success-foreground"],
  ["warning", "bg-warning text-warning-foreground"],
  ["danger", "bg-danger text-danger-foreground"],
  ["info", "bg-info text-info-foreground"],
  ["placeholder", "bg-placeholder text-placeholder-foreground"],
] as const;

const buttonVariants: ButtonVariant[] = ["primary", "accent", "secondary", "outline", "ghost", "danger", "link"];
const buttonSizes: ButtonSize[] = ["sm", "md", "lg"];
const badgeVariants: BadgeVariant[] = ["neutral", "outline", "solid", "success", "warning", "danger", "info"];

const rows = [
  { name: "Toyota Vios", category: "Sedan", rate: 1800 },
  { name: "Toyota Fortuner", category: "SUV", rate: 4200 },
  { name: "Toyota HiAce", category: "Van", rate: 4800 },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Section aria-label={title} className="py-8">
      <h2 className="mb-4">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </Section>
  );
}

export function StyleguideSections() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [payment, setPayment] = useState("gcash");
  const [page, setPage] = useState(2);
  const [stars, setStars] = useState(4);
  const [switchOn, setSwitchOn] = useState(true);
  const [sort, setSort] = useState<SortDirection>("none");

  const sorted =
    sort === "none" ? rows : [...rows].sort((a, b) => (sort === "asc" ? a.rate - b.rate : b.rate - a.rate));

  return (
    <>
      <Block title="Colors (semantic tokens)">
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
          {colorSwatches.map(([name, classes]) => (
            <li key={name} className={`rounded-md border border-border p-3 text-sm ${classes}`}>
              {name}
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Typography">
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <p>Body text with a <a href="#">standard link</a>. Money always uses one helper: {formatCurrency(2800)}.</p>
        <p className="text-sm text-muted">Small muted text</p>
      </Block>

      <Block title="Buttons">
        {buttonSizes.map((size) => (
          <div key={size} className="flex flex-wrap items-center gap-2">
            {buttonVariants.map((variant) => (
              <Button key={variant} variant={variant} size={size}>
                {variant}
              </Button>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Block>

      <Block title="Form controls">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Full name" required hint="As shown on your driver's license.">
            <Input placeholder="Juan Dela Cruz" />
          </FormField>
          <FormField label="Email" error="Enter a valid email address.">
            <Input defaultValue="not-an-email" />
          </FormField>
          <FormField label="Category">
            <Select defaultValue="">
              <option value="" disabled>Choose a category</option>
              <option>Sedan</option>
              <option>SUV</option>
            </Select>
          </FormField>
          <FormField label="Notes">
            <Textarea placeholder="Anything we should know?" />
          </FormField>
          <FormField label="Pick-up date">
            <DatePicker value={date} onChange={setDate} min="2026-01-01" />
          </FormField>
          <FormField label="Pick-up time">
            <TimeSelect value={time} onChange={setTime} />
          </FormField>
          <Checkbox label="I agree to the rental terms" description="You can read them before you pay." />
          <FieldGroup label="Payment method">
            <RadioGroup
              name="styleguide-payment"
              variant="cards"
              value={payment}
              onValueChange={setPayment}
              options={[
                { value: "card", label: "Credit / debit card" },
                { value: "gcash", label: "GCash" },
                { value: "cod", label: "Pay at pick-up", description: "Placeholder option" },
              ]}
            />
          </FieldGroup>
          <FieldGroup label="Star rating (input)">
            <StarRatingInput value={stars} onChange={setStars} />
          </FieldGroup>
          <div className="flex flex-col gap-2">
            <StarRating value={4} />
            <div className="flex items-center gap-2">
              <Switch aria-label="Example switch" checked={switchOn} onCheckedChange={setSwitchOn} />
              <span className="text-sm">{switchOn ? "On" : "Off"}</span>
            </div>
          </div>
        </div>
      </Block>

      <Block title="Cards, badges, media">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <Media asset="vehicle" className="rounded-b-none border-0 border-b" />
            <CardHeader>
              <CardTitle>Toyota Vios</CardTitle>
              <CardDescription>Sedan · Automatic · 5 seats</CardDescription>
            </CardHeader>
            <CardContent>{formatCurrency(1800)} / day</CardContent>
            <CardFooter>
              <Button size="sm">Book now</Button>
            </CardFooter>
          </Card>
          <Card variant="outline">
            <CardHeader><CardTitle>Outline card</CardTitle></CardHeader>
            <CardContent>Card content</CardContent>
          </Card>
          <Card variant="muted">
            <CardHeader><CardTitle>Muted card</CardTitle></CardHeader>
            <CardContent>Card content</CardContent>
          </Card>
        </div>
        <div className="flex flex-wrap gap-2">
          {badgeVariants.map((variant) => (
            <Badge key={variant} variant={variant}>{variant}</Badge>
          ))}
        </div>
      </Block>

      <Block title="Table (sortable)">
        <Table label="Sample vehicles" variant="striped">
          <TableCaption>Click “Rate” to sort.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Category</TableHead>
              <TableHead
                sortDirection={sort}
                onSort={() => setSort(sort === "asc" ? "desc" : "asc")}
              >
                Rate
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.name}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{formatCurrency(row.rate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageCount={5} onPageChange={setPage} />
      </Block>

      <Block title="Tabs, modal, menu, toast">
        <Tabs defaultValue="one">
          <TabsList aria-label="Example tabs">
            <TabsTrigger value="one">Details</TabsTrigger>
            <TabsTrigger value="two">Bookings</TabsTrigger>
            <TabsTrigger value="three">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="one">Details tab content.</TabsContent>
          <TabsContent value="two">Bookings tab content.</TabsContent>
          <TabsContent value="three">Activity tab content.</TabsContent>
        </Tabs>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setModalOpen(true)}>Open modal</Button>
          <DropdownMenu
            trigger={<Button variant="outline">Actions</Button>}
            items={[
              { label: "Edit", onSelect: () => toast({ title: "Edit clicked" }) },
              { label: "Duplicate", disabled: true },
              "separator",
              { label: "Delete", destructive: true, onSelect: () => toast({ title: "Deleted", variant: "danger" }) },
            ]}
          />
          <Button variant="secondary" onClick={() => toast({ title: "Saved", description: "Your changes were saved.", variant: "success" })}>
            Show toast
          </Button>
        </div>
        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Delete this lead?"
          description="This cannot be undone."
          variant="danger"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setModalOpen(false)}>Delete</Button>
            </>
          }
        />
      </Block>

      <Block title="States and steps">
        <Stepper
          currentIndex={2}
          steps={[
            { id: "dates", label: "Dates" },
            { id: "vehicle", label: "Vehicle" },
            { id: "details", label: "Details" },
            { id: "payment", label: "Payment" },
            { id: "check", label: "Check" },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Alert variant="info" title="Heads up">Prices include VAT.</Alert>
          <Alert variant="success" title="Booking confirmed">Reference RC-2026-0001.</Alert>
          <Alert variant="warning" title="Almost full">Only 2 vehicles left.</Alert>
          <Alert variant="danger" title="Payment failed">Please try another method.</Alert>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState title="No customers yet" description="Add your first customer to get started." action={<Button size="sm">Add customer</Button>} />
          <ErrorState onRetry={() => toast({ title: "Retrying…" })} />
        </div>
        <div className="flex flex-col gap-2">
          <Spinner />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </Block>
    </>
  );
}
