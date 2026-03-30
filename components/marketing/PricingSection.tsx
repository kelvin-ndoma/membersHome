"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for small organizations getting started",
    features: ["Up to 50 members", "Basic reports", "Email support", "Single house"],
    buttonText: "Get Started",
    popular: false,
  },
  {
    name: "Starter",
    price: "$29",
    description: "Great for growing organizations",
    features: ["Up to 500 members", "Advanced reports", "Priority support", "Up to 5 houses", "Ticket sales"],
    buttonText: "Start Free Trial",
    popular: true,
  },
  {
    name: "Professional",
    price: "$99",
    description: "For organizations with advanced needs",
    features: ["Unlimited members", "Custom branding", "API access", "Unlimited houses", "Advanced analytics"],
    buttonText: "Contact Sales",
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that works best for you
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg" : ""}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/auth/register" className="w-full">
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.buttonText}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}