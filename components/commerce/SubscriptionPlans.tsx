"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Check, Sparkles, Crown, Star } from "lucide-react"

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: "month" | "year"
  features: string[]
  popular?: boolean
}

interface SubscriptionPlansProps {
  plans: Plan[]
  currentPlan?: string
  onSelectPlan: (planId: string) => void
  isLoading?: boolean
}

const planIcons: Record<string, React.ReactNode> = {
  Free: <Star className="h-6 w-6 text-gray-500" />,
  Starter: <Sparkles className="h-6 w-6 text-blue-500" />,
  Professional: <Crown className="h-6 w-6 text-purple-500" />,
  Enterprise: <Sparkles className="h-6 w-6 text-yellow-500" />,
}

export function SubscriptionPlans({ plans, currentPlan, onSelectPlan, isLoading = false }: SubscriptionPlansProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getPlanName = (planId: string) => {
    switch (planId) {
      case "price_free": return "Free"
      case "price_starter": return "Starter"
      case "price_professional": return "Professional"
      case "price_enterprise": return "Enterprise"
      default: return planId
    }
  }

  const displayPlans = plans.map(plan => ({
    ...plan,
    name: getPlanName(plan.id),
  }))

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {displayPlans.map((plan) => {
        const isCurrent = currentPlan === plan.id
        const isFree = plan.price === 0

        return (
          <Card key={plan.id} className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                {planIcons[plan.name] || <Star className="h-6 w-6" />}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>
                {isFree ? (
                  <span className="text-3xl font-bold text-foreground">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.interval}
                    </span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={isCurrent ? "outline" : plan.popular ? "default" : "secondary"}
                onClick={() => onSelectPlan(plan.id)}
                disabled={isLoading || isCurrent}
              >
                {isCurrent ? "Current Plan" : isFree ? "Get Started" : "Upgrade"}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}