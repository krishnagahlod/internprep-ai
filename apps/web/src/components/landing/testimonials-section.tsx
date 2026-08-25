"use client";

import { motion } from "framer-motion";
import { Star, Building2, TrendingUp, Briefcase } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Rahul Verma",
    role: "Incoming Associate, BCG",
    image: "RV",
    quote: "The pushback engine is brutally realistic. In my actual BCG final round, the partner interrupted my market sizing exactly the way the AI did in my 4th practice run. I didn't panic because I had already trained for it.",
    metric: "Shortlisted from 800+ applicants",
    icon: Building2,
    color: "emerald"
  },
  {
    name: "Sneha Rao",
    role: "SDE-1, Microsoft",
    image: "SR",
    quote: "I thought my resume was ATS-friendly until the Resume Intelligence engine highlighted 3 major red flags. The 1-click rewrite quantified my backend latency improvements perfectly. Got the interview call 4 days later.",
    metric: "ATS Match jumped 45% → 92%",
    icon: TrendingUp,
    color: "cyan"
  },
  {
    name: "Aman Gupta",
    role: "Summer Analyst, Goldman Sachs",
    image: "AG",
    quote: "I used the digital whiteboard feature to practice my DCF structure while speaking. Being forced to articulate finance technicals out loud instead of just doing math in silence made all the difference on Day 1.",
    metric: "Converted PPO in 8 weeks",
    icon: Briefcase,
    color: "violet"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
            ))}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-outfit tracking-tight text-foreground mb-4">
            Don't just take our word for it. <br />
            <span className="text-transparent bg-clip-text bg-gradient-premium">Ask the ones who made it.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, idx) => {
            const Icon = testimonial.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-panel bg-white/40 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 rounded-3xl p-8 flex flex-col hover:-translate-y-1 transition-transform duration-300"
              >
                <div className={`mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-${testimonial.color}-500/10 text-${testimonial.color}-600 dark:text-${testimonial.color}-400 text-xs font-bold border border-${testimonial.color}-500/20`}>
                  <Icon className="w-4 h-4" />
                  {testimonial.metric}
                </div>
                
                <p className="text-foreground font-medium leading-relaxed mb-8 flex-1 italic">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-border/50">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-${testimonial.color}-400 to-${testimonial.color}-600 flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{testimonial.name}</h4>
                    <p className="text-xs text-muted-foreground font-medium">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Global Metrics */}
        <div className="mt-20 pt-10 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
          <div>
            <div className="text-4xl font-black text-foreground font-outfit mb-1">98%</div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Placement Rate</div>
          </div>
          <div>
            <div className="text-4xl font-black text-foreground font-outfit mb-1">15k+</div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resumes Optimized</div>
          </div>
          <div>
            <div className="text-4xl font-black text-foreground font-outfit mb-1">4.9/5</div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Average Rating</div>
          </div>
          <div>
            <div className="text-4xl font-black text-foreground font-outfit mb-1">200+</div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Campuses Reached</div>
          </div>
        </div>

      </div>
    </section>
  );
}
