import Link from 'next/link'
import { 
  RocketLaunchIcon, 
  UsersIcon, 
  CpuChipIcon, 
  CodeBracketIcon, 
  ChartBarIcon, 
  CheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function Home() {
  const benefits = [
    {
      icon: UsersIcon,
      title: 'People-as-a-Service',
      description: 'Need a frontend dev for 2 weeks? A sales team for a month? We scale up or down instantly — no long-term contracts, no overhead.'
    },
    {
      icon: RocketLaunchIcon,
      title: 'Built for Early-Stage Teams',
      description: 'We know your early days are about survival and traction. We take on the critical-but-time-consuming work so you can double down on product-market fit and growth.'
    },
    {
      icon: CpuChipIcon,
      title: 'AI at the Core',
      description: 'Every tielo service is AI-enabled: HR, Sales, Marketing, and Development — all powered by cutting-edge artificial intelligence.'
    }
  ]

  const services = [
    {
      icon: CodeBracketIcon,
      title: 'Product Development',
      items: ['Frontend & backend engineering', 'AI integration into your apps', 'Rapid MVP creation']
    },
    {
      icon: ChartBarIcon,
      title: 'Go-to-Market & Growth',
      items: ['Sales pipeline setup & automation', 'AI-powered lead generation', 'Marketing strategies that rank & convert']
    },
    {
      icon: CheckIcon,
      title: 'People & Ops',
      items: ['AI-enabled HR platforms', 'Recruiting & onboarding', 'Process automation']
    }
  ]

  const trustIndicators = [
    'Trusted by 100+ startups',
    'AI-powered solutions since 2024',
    'Flexible scaling, no contracts',
    'Focus on what matters most'
  ]

  const testimonials = [
    {
      quote: "tielo helped us launch our MVP in 3 weeks when we were down to our last runway. Their AI-powered approach saved us months of development time.",
      author: "Sarah Chen",
      role: "Founder, TechFlow"
    },
    {
      quote: "The flexibility to scale our sales team up and down based on our needs has been game-changing. No more worrying about long-term commitments.",
      author: "Marcus Rodriguez",
      role: "CEO, GrowthLab"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              tielo —{' '}
              <span className="text-blue-600">Rooted Support</span>
              <br />
              for Startup Growth
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto animate-fade-in-delay-1">
              We&apos;re your flexible, AI-powered product and operations partner. From code to customers, we help you build fast, scale smart, and focus on what matters.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
              <Link
                href="/contact"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                Book a Call
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/services"
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                See Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              What We Do
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              At tielo, we serve startups and small teams who need to move fast without burning out. We cover everything from product development to sales, marketing, and HR — so your core team can focus on vision, not busywork.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose tielo Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Choose tielo
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <benefit.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Services
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-gray-50 p-8 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <service.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <ul className="space-y-2">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-start space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              How We Work
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'You tell us your goal',
                description: 'Product launch, customer acquisition, internal system setup'
              },
              {
                step: '2',
                title: 'We assemble your team',
                description: 'From our bench of skilled devs, marketers, recruiters, and salespeople'
              },
              {
                step: '3',
                title: 'We deliver, then adjust',
                description: 'Scale up, scale down, or stop anytime'
              }
            ].map((item) => (
              <div
                key={item.step}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Name Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            The Name
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            <span className="font-semibold text-blue-600">tielo</span> — from &quot;tied&quot; and &quot;low.&quot;
          </p>
          <p className="text-lg text-gray-600">
            Our work is rooted at the foundation of your business, not just at the surface. We handle the groundwork so your vision can rise.
          </p>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Trusted by Startups
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustIndicators.map((indicator) => (
              <div
                key={indicator}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-700 font-medium">{indicator}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              What Our Clients Say
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 text-lg mb-6 italic">
                  &quot;{testimonial.quote}&quot;
                </blockquote>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Let&apos;s Build Your Startup&apos;s Foundation
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Whether you need a team for a week or a partner for the next 6 months, we&apos;ve got you.
          </p>
          <Link
            href="/contact"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Talk to Us
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
