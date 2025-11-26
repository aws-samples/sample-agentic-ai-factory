import { Activity, Cpu, Workflow, Plug, TrendingUp, DollarSign, Zap, Clock, CheckCircle, Plus, Users, BarChart3 } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AwsBanner } from '../components/ui/aws-banner';

const weeklyData = [
  { day: 'Mon', Completed: 7, Failed: 2 },
  { day: 'Tue', Completed: 10, Failed: 1 },
  { day: 'Wed', Completed: 9, Failed: 2 },
  { day: 'Thu', Completed: 14, Failed: 2 },
  { day: 'Fri', Completed: 13, Failed: 1 },
  { day: 'Sat', Completed: 6, Failed: 1 },
  { day: 'Sun', Completed: 5, Failed: 0 },
];

const growthData = [
  { month: 'Aug', Agents: 35, Utilization: 65 },
  { month: 'Sep', Agents: 40, Utilization: 70 },
  { month: 'Oct', Agents: 45, Utilization: 75 },
  { month: 'Nov', Agents: 47, Utilization: 80 },
];

const requestStatusData = [
  { name: 'Completed', value: 58, percentage: 72 },
  { name: 'In Progress', value: 12, percentage: 15 },
  { name: 'Planning', value: 8, percentage: 10 },
  { name: 'Failed', value: 3, percentage: 4 },
];

const agentTypesData = [
  { name: 'Data Analysis', value: 12 },
  { name: 'Content Gen', value: 8 },
  { name: 'Code Review', value: 15 },
  { name: 'Customer Support', value: 7 },
  { name: 'Forecasting', value: 5 },
];

const systemPerformanceData = [
  { metric: 'Uptime', value: 100 },
  { metric: 'Response Time', value: 75 },
  { metric: 'Success Rate', value: 90 },
  { metric: 'Resource Util', value: 85 },
  { metric: 'Security Score', value: 80 },
];

const monthlyCostData = [
  { month: 'Aug', cost: 12500 },
  { month: 'Sep', cost: 13800 },
  { month: 'Oct', cost: 14200 },
  { month: 'Nov', cost: 16500 },
  { month: 'Dec', cost: 17800 },
];

const pipelineStageData = [
  { stage: 'Assess', avgTime: 15, requestCount: 90 },
  { stage: 'Plan', avgTime: 30, requestCount: 75 },
  { stage: 'Implement', avgTime: 120, requestCount: 65 },
  { stage: 'Iterate', avgTime: 45, requestCount: 55 },
];

const STATUS_COLORS = ['#00C896', '#3B82F6', '#FF9900', '#EF4444'];
const AGENT_COLORS = ['#3B82F6', '#00C896', '#8B5CF6', '#FF9900', '#EC4899'];

export function Dashboard() {
  return (
    <div className="flex-1 flex flex-col bg-[#f2f3f3]" style={{margin:"15px"}}>
      <AwsBanner />
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h2 className="text-[#232f3e] text-2xl font-bold mb-2" style={{marginTop:"15px"}}>Dashboard</h2>
          <p className="text-[#687078] text-sm">
            Welcome to your AI Factory. Monitor your agents, workflows, and requests.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 flex-1" style={{display:"flex"}}>
          {/* Active Requests */}
          <div className="bg-white border border-[#d5dbdb] rounded-lg p-6" style={{padding:"20px", width:"25%"}}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#687078] text-sm mb-1">Active Requests</p>
                <p className="text-[#232f3e] text-3xl font-bold">12</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-[#687078] text-xs">Currently processing</p>
            <p className="text-green-600 text-xs mt-1" style={{color:" #00a63e"}}>↑ +2 from yesterday</p>
          </div>

          {/* Deployed Agents */}
          <div className="bg-white border border-[#00a63e] rounded-lg p-5 w-1/4" style={{padding:"20px", width:"25%", border:"1px solid #00a63e"}}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#687078] text-sm mb-1">Deployed Agents</p>
                <p className="text-[#232f3e] text-3xl font-bold">47</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-[#00C896]" />
              </div>
            </div>
            <p className="text-[#687078] text-xs">AI agents available</p>
            <p className="text-green-600 text-xs mt-1" style={{color:"#00a63e"}}>↑ +5 this week</p>
          </div>

          {/* Workflows */}
          <div className="bg-white border border-[#d5dbdb] rounded-lg p-6"  style={{padding:"20px", width:"25%"}}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#687078] text-sm mb-1">Workflows</p>
                <p className="text-[#232f3e] text-3xl font-bold">23</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-[#687078] text-xs">Automation pipelines</p>
            <p className="text-green-600 text-xs mt-1" style={{color:"#00a63e"}}>↑ +3 this month</p>
          </div>

          {/* Integrations */}
          <div className="bg-white border border-[#d5dbdb] rounded-lg p-6"  style={{padding:"20px", width:"25%"}}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#687078] text-sm mb-1">Integrations</p>
                <p className="text-[#232f3e] text-3xl font-bold">8</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Plug className="w-5 h-5 text-[#FF9900]" />
              </div>
            </div>
            <p className="text-[#687078] text-xs">Connected services</p>
            <p className="text-[#232f3e] text-xs mt-1">100% All active</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6" style={{display:"flex"}}>
          {/* Weekly Request Activity */}
          <div className="bg-white border border-[#d5dbdb] rounded-lg p-6" style={{width:"50%", padding:'15px'}}>
            <div className="mb-4">
              <h3 className="text-[#232f3e] text-lg font-semibold mb-1">Weekly Request Activity</h3>
              <p className="text-[#687078] text-sm">Request volume and completion rate over the past week</p>
            </div>
            <ResponsiveContainer width="100%" height={300} style={{padding:"15px"}}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dbdb" />
                <XAxis dataKey="day" stroke="#687078" style={{ fontSize: '12px' }} />
                <YAxis stroke="#687078" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d5dbdb',
                    borderRadius: '8px',
                    color: '#232f3e'
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  iconType="square"
                />
                <Bar dataKey="Completed" fill="#00C896" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Agent Growth & Utilization */}
          <div className="bg-white border border-[#d5dbdb] rounded-lg p-6"  style={{width:"50%", padding:'15px'}}>
            <div className="mb-4">
              <h3 className="text-[#232f3e] text-lg font-semibold mb-1">Agent Growth & Utilization</h3>
              <p className="text-[#687078] text-sm">Agent count and average utilization over time</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B4DE6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6B4DE6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dbdb" />
                <XAxis dataKey="month" stroke="#687078" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="left" stroke="#687078" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#687078" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d5dbdb',
                    borderRadius: '8px',
                    color: '#232f3e'
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  iconType="line"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="Agents"
                  stroke="#6B4DE6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAgents)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="Utilization"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUtilization)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Charts Row 1 - Three Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6" style={{marginTop:"20px"}}>
          {/* Request Status */}
          <div className="bg-white border border-[#d5dbdb] rounded-lg p-6" style={{padding:"20px"}}>
            <div className="mb-4">
              <h3 className="text-[#232f3e] text-lg font-semibold mb-1">Request Status</h3>
              <p className="text-[#687078] text-sm">Current status breakdown</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={requestStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {requestStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d5dbdb',
                    borderRadius: '8px',
                    color: '#232f3e'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {requestStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[index] }}
                    />
                    <span className="text-[#232f3e]">{item.name}</span>
                  </div>
                  <span className="text-[#687078]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Types */}
          <div className="bg-white border border-[#d5dbdb] rounded-lg p-6" style={{padding:"20px"}}>
            <div className="mb-4">
              <h3 className="text-[#232f3e] text-lg font-semibold mb-1">Agent Types</h3>
              <p className="text-[#687078] text-sm">Distribution by agent category</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={agentTypesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={(entry) => entry.value}
                  labelLine={false}
                >
                  {agentTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={AGENT_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d5dbdb',
                    borderRadius: '8px',
                    color: '#232f3e'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {agentTypesData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: AGENT_COLORS[index] }}
                    />
                    <span className="text-[#232f3e]">{item.name}</span>
                  </div>
                  <span className="text-[#687078]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Performance */}
          <div className="bg-white border border-[#d5dbdb] rounded-lg p-6" style={{padding:"20px"}}>
            <div className="mb-4">
              <h3 className="text-[#232f3e] text-lg font-semibold mb-1">System Performance</h3>
              <p className="text-[#687078] text-sm">Multi-dimensional health metrics</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={systemPerformanceData}>
                <PolarGrid stroke="#d5dbdb" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#687078', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#687078', fontSize: 10 }}
                  stroke="#d5dbdb"
                />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d5dbdb',
                    borderRadius: '8px',
                    color: '#232f3e'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-[#232f3e] text-3xl font-bold">98%</p>
              <p className="text-[#687078] text-sm">Overall Health Score</p>
            </div>
          </div>
        </div>

        {/* Additional Charts Row 2 - Two Cards */}
        <div className="grid grid-cols-2 gap-6 mt-6" style={{marginTop:"20px", display:"flex"}}>
          {/* Monthly Cost Trend */}
          <div className="bg-white border border-[#d5dbdb] rounded-lg p-6" style={{padding:"20px", width:"50%"}}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-[#232f3e] text-lg font-semibold mb-1 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Monthly Cost Trend
                </h3>
                <p className="text-[#687078] text-sm">Infrastructure and operational costs over time</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dbdb" />
                <XAxis
                  dataKey="month"
                  stroke="#687078"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#687078"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d5dbdb',
                    borderRadius: '8px',
                    color: '#232f3e'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monthly Cost ($)']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  formatter={() => 'Monthly Cost ($)'}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#FF9900"
                  strokeWidth={2}
                  dot={{ fill: '#FF9900', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Monthly Cost Metrics */}
            <div className="flex gap-3 mt-4">
              <div className="flex-1 rounded-lg p-2 text-center" style={{backgroundColor: "oklch(0.27 0 0)"}}>
                <p className="text-white text-2xl font-bold mb-1">$16,800</p>
                <p className="text-[#9ca3af] text-xs">Current Month</p>
              </div>
              <div className="flex-1 rounded-lg p-2 text-center" style={{backgroundColor: "oklch(0.27 0 0)"}}>
                <p className="text-[#00a63e] text-2xl font-bold mb-1">+9.2%</p>
                <p className="text-[#9ca3af] text-xs">vs Last Month</p>
              </div>
              <div className="flex-1 rounded-lg p-2 text-center" style={{backgroundColor: "oklch(0.27 0 0)"}}>
                <p className="text-white text-2xl font-bold mb-1">$14,517</p>
                <p className="text-[#9ca3af] text-xs">Avg Monthly</p>
              </div>
            </div>
          </div>

          {/* Pipeline Stage Performance */}
          <div className="bg-white border border-[#d5dbdb] rounded-lg p-6"  style={{padding:"20px", width:"50%"}}>
            <div className="mb-4">
              <h3 className="text-[#232f3e] text-lg font-semibold mb-1">Pipeline Stage Performance</h3>
              <p className="text-[#687078] text-sm">Average processing time and volume by stage</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineStageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5dbdb" />
                <XAxis
                  dataKey="stage"
                  stroke="#687078"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#687078"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Avg Time (min)', angle: -90, position: 'insideLeft', style: { fill: '#687078', fontSize: '12px' } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#687078"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Request Count', angle: 90, position: 'insideRight', style: { fill: '#687078', fontSize: '12px' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d5dbdb',
                    borderRadius: '8px',
                    color: '#232f3e'
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  iconType="square"
                />
                <Bar yAxisId="left" dataKey="avgTime" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Avg Time (min)" />
                <Bar yAxisId="right" dataKey="requestCount" fill="#00C896" radius={[4, 4, 0, 0]} name="Request Count" />
              </BarChart>
            </ResponsiveContainer>

            {/* Pipeline Total Time Metric */}
            <div className="mt-4
             rounded-lg p-2 text-center" style={{backgroundColor: "oklch(0.27 0 0)"}}>
              <p className="text-white text-2xl font-bold mb-1">205 minutes avg</p>
              <p className="text-[#9ca3af] text-xs">Total Pipeline Time</p>
            </div>
          </div>
        </div>

        {/* System Health and Recent Activity Row */}
        <div className="grid grid-cols-2 gap-6 mt-6" style={{marginTop:"20px", display:"flex"}}>
          {/* System Health */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{padding:"20px", width:"50%"}}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-white" />
                <h3 className="text-white text-lg font-semibold">System Health</h3>
              </div>
              <p className="text-[#5dd9c1] text-sm">Real-time status of your AI factory components</p>
            </div>

            <div className="space-y-4">
              {/* Overall Health */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">Overall Health</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-bold">98%</span>
                    <span className="px-2 py-0.5 bg-[#00C896] text-[#0a0a0a] text-xs rounded-full font-medium">Excellent</span>
                  </div>
                </div>
                <div className="w-full rounded-full" style={{ backgroundColor: '#2a2a2a', height: '8px' }}>
                  <div className="rounded-full" style={{ width: '98%', backgroundColor: 'white', height: '8px' }}></div>
                </div>
              </div>

              {/* Agents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#6b7280]" />
                    <span className="text-white text-sm">Agents</span>
                  </div>
                  <span className="text-white text-sm">95%</span>
                </div>
                <div className="w-full rounded-full" style={{ backgroundColor: '#2a2a2a', height: '8px' }}>
                  <div className="rounded-full" style={{ width: '95%', backgroundColor: 'white', height: '8px' }}></div>
                </div>
              </div>

              {/* Workflows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4" style={{color: "#a855f7"}} />
                    <span className="text-white text-sm">Workflows</span>
                  </div>
                  <span className="text-white text-sm">100%</span>
                </div>
                <div className="w-full rounded-full" style={{ backgroundColor: '#2a2a2a', height: '8px' }}>
                  <div className="rounded-full" style={{ width: '100%', backgroundColor: 'white', height: '8px' }}></div>
                </div>
              </div>

              {/* Integrations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Plug className="w-4 h-4" style={{color: "#ef4444"}} />
                    <span className="text-white text-sm">Integrations</span>
                  </div>
                  <span className="text-white text-sm">96%</span>
                </div>
                <div className="w-full rounded-full" style={{ backgroundColor: '#2a2a2a', height: '8px' }}>
                  <div className="rounded-full" style={{ width: '96%', backgroundColor: 'white', height: '8px' }}></div>
                </div>
              </div>

              {/* Infrastructure */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" style={{color: "#3b82f6"}} />
                    <span className="text-white text-sm">Infrastructure</span>
                  </div>
                  <span className="text-white text-sm">94%</span>
                </div>
                <div className="w-full rounded-full" style={{ backgroundColor: '#2a2a2a', height: '8px' }}>
                  <div className="rounded-full" style={{ width: '94%', backgroundColor: 'white', height: '8px' }}></div>
                </div>
              </div>

              {/* Security Status */}
              <div className="pt-4 border-t border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#00C896]" />
                    <span className="text-white text-sm font-medium">Security Status</span>
                  </div>
                  <span className="px-3 py-1 bg-[#00C896] text-[#0a0a0a] text-xs rounded-md font-medium">All Clear</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{padding:"20px", width:"50%"}}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-white" />
                <h3 className="text-white text-lg font-semibold">Recent Activity</h3>
              </div>
              <p className="text-[#5dd9c1] text-sm">Latest updates across your AI factory</p>
            </div>

            <div className="space-y-4">
              {/* Activity Item 1 */}
              <div className="flex items-start gap-3 pb-4 border-b border-[#2a2a2a]">
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor: "#00a63e"}}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white text-sm font-medium">E-commerce Dashboard completed</p>
                    <span className="px-2 py-0.5 bg-[#2a2a2a] text-[#9ca3af] text-xs rounded-md whitespace-nowrap">request</span>
                  </div>
                  <p className="text-[#9ca3af] text-xs">Analysis and design phases finished</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-[#9ca3af]" />
                    <span className="text-[#9ca3af] text-xs">2 hours ago</span>
                  </div>
                </div>
              </div>

              {/* Activity Item 2 */}
              <div className="flex items-start gap-3 pb-4 border-b border-[#2a2a2a]">
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor: "#3b82f6"}}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white text-sm font-medium">New Data Analyst Agent deployed</p>
                    <span className="px-2 py-0.5 bg-[#2a2a2a] text-[#9ca3af] text-xs rounded-md whitespace-nowrap">agent</span>
                  </div>
                  <p className="text-[#9ca3af] text-xs">Version 2.1 with improved accuracy</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-[#9ca3af]" />
                    <span className="text-[#9ca3af] text-xs">4 hours ago</span>
                  </div>
                </div>
              </div>

              {/* Activity Item 3 */}
              <div className="flex items-start gap-3 pb-4 border-b border-[#2a2a2a]">
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor: "#3b82f6"}}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white text-sm font-medium">Invoice Processing workflow updated</p>
                    <span className="px-2 py-0.5 bg-[#2a2a2a] text-[#9ca3af] text-xs rounded-md whitespace-nowrap">workflow</span>
                  </div>
                  <p className="text-[#9ca3af] text-xs">Added OCR validation step</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-[#9ca3af]" />
                    <span className="text-[#9ca3af] text-xs">6 hours ago</span>
                  </div>
                </div>
              </div>

              {/* Activity Item 4 */}
              <div className="flex items-start gap-3 pb-4">
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor: "#00a63e"}}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white text-sm font-medium">Slack integration configured</p>
                    <span className="px-2 py-0.5 bg-[#2a2a2a] text-[#9ca3af] text-xs rounded-md whitespace-nowrap">integration</span>
                  </div>
                  <p className="text-[#9ca3af] text-xs">Now receiving notifications</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-[#9ca3af]" />
                    <span className="text-[#9ca3af] text-xs">1 day ago</span>
                  </div>
                </div>
              </div>

              {/* View All Activity Button */}
              <button className="w-full mt-4 py-2 text-center text-white text-sm font-medium hover:bg-[#2a2a2a] rounded-lg transition-colors border border-[#2a2a2a]">
                View All Activity
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-[#d5dbdb] rounded-lg p-6 mt-6" style={{marginTop:"20px", padding:"20px"}}>
          <div className="mb-4">
            <h3 className="text-[#232f3e] text-lg font-semibold mb-1">Quick Actions</h3>
            <p className="text-[#687078] text-sm">Get started with common tasks</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#d5dbdb] text-[#232f3e] text-sm font-medium rounded-lg hover:bg-[#f2f3f3] transition-colors">
              <Plus className="w-4 h-4" />
              Deploy New Agent
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#d5dbdb] text-[#232f3e] text-sm font-medium rounded-lg hover:bg-[#f2f3f3] transition-colors">
              <Workflow className="w-4 h-4" />
              Create Workflow
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#d5dbdb] text-[#232f3e] text-sm font-medium rounded-lg hover:bg-[#f2f3f3] transition-colors">
              <Plug className="w-4 h-4" />
              Add Integration
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#d5dbdb] text-[#232f3e] text-sm font-medium rounded-lg hover:bg-[#f2f3f3] transition-colors">
              <Users className="w-4 h-4" />
              Invite Team Member
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#d5dbdb] text-[#232f3e] text-sm font-medium rounded-lg hover:bg-[#f2f3f3] transition-colors">
              <BarChart3 className="w-4 h-4" />
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
