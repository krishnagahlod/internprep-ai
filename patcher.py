import re

page_path = 'apps/web/src/app/resume-builder/page.tsx'
strategy_path = 'apps/web/src/app/resume-builder/strategy/page.tsx'

with open(page_path, 'r', encoding='utf-8') as f:
    page_content = f.read()

with open(strategy_path, 'r', encoding='utf-8') as f:
    strategy_content = f.read()

# 1. Add imports
if 'AlertTriangle' not in page_content:
    page_content = page_content.replace('import { UploadCloud', 'import { AlertTriangle, AlertCircle, UploadCloud')
if 'recharts' not in page_content:
    recharts_import = 'import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts"\n'
    page_content = page_content.replace('import { Badge } from "@/components/ui/badge"', 'import { Badge } from "@/components/ui/badge"\n' + recharts_import)

# 2. Add Strategy states
if 'const [strategyTargetRole, setStrategyTargetRole] = useState("consulting")' not in page_content:
    state_injection = '''  const [strategyTargetRole, setStrategyTargetRole] = useState("consulting")
  const [strategyDataSource, setStrategyDataSource] = useState("both")
'''
    page_content = page_content.replace('const [strategyTargetCompany, setStrategyTargetCompany] = useState("")', state_injection + '  const [strategyTargetCompany, setStrategyTargetCompany] = useState("")')

# 3. Add handleStrategyRefine
if 'const handleStrategyRefine =' not in page_content:
    refine_func = '''
  const handleStrategyRefine = (point_id: string, instruction: string, section?: string) => {
    const bullet = pointBank.find(b => b.id === point_id);
    if (bullet) {
      setRefineTarget({ 
        source: "bank", 
        id: bullet.id, 
        text: bullet.bullet_text, 
        role: bullet.target_role 
      });
      if (instruction) setRefineInstruction(instruction);
      if (section) setComposerHeading(section);
      setRefineHistory([]);
      setActiveTab("bank");
    }
  }
'''
    page_content = page_content.replace('const generateVariants = async () => {', refine_func + '\n  const generateVariants = async () => {')

# 4. Add generateStrategy
if 'const generateStrategy = async () => {' not in page_content:
    gen_func = '''
  const generateStrategy = async () => {
    if (!user) return
    setIsStrategyLoading(true)
    try {
      const res = await fetch(`${apiBase}/builder/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          target_role: strategyTargetRole,
          data_source: strategyDataSource,
          target_company: strategyTargetCompany || undefined,
          job_description: strategyJobDescription || undefined
        })
      })
      if (res.ok) {
        setStrategyData(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsStrategyLoading(false)
    }
  }
'''
    page_content = page_content.replace('const generateVariants = async () => {', gen_func + '\n  const generateVariants = async () => {')

# 5. Extract Strategy JSX from strategy/page.tsx
jsx_match = re.search(r'return \(\s*<div className="container max-w-6xl py-8 space-y-8 animate-in fade-in duration-500">(.*?)</div>\s*\)\s*}\s*export default function StrategyPage', strategy_content, re.DOTALL)
if jsx_match:
    jsx_content = jsx_match.group(1)
    
    # Replace variable names
    jsx_content = jsx_content.replace('targetRole', 'strategyTargetRole')
    jsx_content = jsx_content.replace('setTargetRole', 'setStrategyTargetRole')
    jsx_content = jsx_content.replace('dataSource', 'strategyDataSource')
    jsx_content = jsx_content.replace('setDataSource', 'setStrategyDataSource')
    jsx_content = jsx_content.replace('targetCompany', 'strategyTargetCompany')
    jsx_content = jsx_content.replace('setTargetCompany', 'setStrategyTargetCompany')
    jsx_content = jsx_content.replace('jobDescription', 'strategyJobDescription')
    jsx_content = jsx_content.replace('setJobDescription', 'setStrategyJobDescription')
    jsx_content = jsx_content.replace('isLoading', 'isStrategyLoading')
    jsx_content = jsx_content.replace('handleRefine', 'handleStrategyRefine')
    
    # Remove the back to builder button block completely
    jsx_content = re.sub(r'<div className="flex items-center gap-2 text-muted-foreground mb-2">.*?</div>', '', jsx_content, flags=re.DOTALL)

    # Wrap in TabsContent
    tabs_content = f'''
        <TabsContent value="strategy" className="mt-6 space-y-6 animate-in fade-in duration-500">
          <div className="container max-w-6xl py-8 space-y-8">
            {jsx_content}
          </div>
        </TabsContent>
'''
    
    if '<TabsContent value="strategy"' not in page_content:
        # Avoid backslash problems inside Python strings
        page_content = page_content.replace('</Tabs>', tabs_content + '\n      </Tabs>')

# Add strategy tab trigger
if 'value="strategy"' not in page_content:
    tab_trigger = '''
          <TabsTrigger value="strategy" className="flex-1 py-3 text-sm md:text-base font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            Strategy Engine
          </TabsTrigger>
'''
    page_content = page_content.replace('</TabsTrigger>\n        </TabsList>', '</TabsTrigger>' + tab_trigger + '        </TabsList>')

with open('patched_page.tsx', 'w', encoding='utf-8') as f:
    f.write(page_content)
