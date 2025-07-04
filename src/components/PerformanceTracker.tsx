"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Calendar, Clock, MapPin, Users, Star, Plus, Edit3, BarChart3, Zap, Target, HelpCircle, Filter, LogIn } from "lucide-react"
import { PerformanceChart } from "@/components/PerformanceChart"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"

// Mock data for performances
const mockPerformances = [
  {
    id: 1,
    title: "Open Mic Night",
    venue: "The Comedy Cellar",
    date: "2024-06-15",
    duration: "7 minutes",
    audienceSize: 45,
    rating: 4.2,
    jokesCount: 12,
    killCount: 8,
    bombCount: 2,
    notes:
      "Great crowd response to the dating material. Need to work on timing for the airplane joke. The audience was really engaged during the first half, but I lost them a bit with the longer story about my roommate. Should probably cut that down or punch it up with more callbacks.",
    transcript:
      "So I went on a date last week... [crowd laughs] Yeah, I know, shocking right? My friends were like 'Wait, someone actually said yes?' [bigger laugh] Anyway, she asked me what I do for fun, and I said 'I talk to myself for money.' [crowd laughs] She didn't get it. That should have been red flag number one... [laughter continues]\n\nBut seriously, dating apps are weird. My profile says I'm 6 feet tall, which is true... if you count my hair and shoes. [scattered laughs] And don't get me started on the photos. Everyone looks like a model until you meet them and realize they're using pictures from 2019... or someone else entirely. [audience laughs]\n\nSo we meet at this coffee shop, and she orders a drink that takes longer to say than it does to make. 'I'll have a half-caff, oat milk, sugar-free vanilla, extra hot, no foam latte with a shot of optimism.' [big laugh] I just said 'Coffee. Black. Like my soul.' [laughter]",
    tags: ["dating", "relationships", "observational"],
    mood: "confident",
  },
  {
    id: 2,
    title: "Corporate Gig",
    venue: "Tech Conference 2024",
    date: "2024-06-10",
    duration: "15 minutes",
    audienceSize: 200,
    rating: 3.8,
    jokesCount: 18,
    killCount: 10,
    bombCount: 5,
    notes:
      "Tough crowd - very corporate. The tech jokes landed well but personal stories fell flat. Stick to industry humor for these gigs. The opening about debugging was solid, got good laughs. Middle section dragged - need to tighten up the cloud computing bit. Ending was strong with the AI jokes.",
    transcript:
      "How many programmers does it take to change a light bulb? [pause] None, that's a hardware problem! [scattered laughs] I see we have some developers in the audience... don't worry, I won't ask you to fix my WiFi after this.\n\nI love working in tech because it's the only industry where you can spend 6 hours debugging code, only to realize you forgot a semicolon. [knowing laughs] It's like being a detective, but the only crime is your own stupidity. [more laughs]\n\nAnd can we talk about 'the cloud'? [gestures upward] Everything's in the cloud now. My photos, my documents, my existential dread... it's all up there somewhere. [chuckles] I asked my IT guy where exactly the cloud is, and he pointed at a server room in Ohio. [bigger laugh] Turns out the cloud is just someone else's computer with better marketing.",
    tags: ["tech", "corporate", "clean"],
    mood: "nervous",
  },
  {
    id: 3,
    title: "Weekend Showcase",
    venue: "Laugh Track Comedy Club",
    date: "2024-06-08",
    duration: "12 minutes",
    audienceSize: 80,
    rating: 4.7,
    jokesCount: 15,
    killCount: 13,
    bombCount: 1,
    notes:
      "Best set in weeks! The new material about social media killed. Audience was super engaged throughout. The Instagram vs reality bit got the biggest laugh of the night. Definitely keeping this in the rotation. Great energy from the crowd, felt like I could do no wrong up there.",
    transcript:
      "I deleted Facebook last month... [crowd cheers] Yeah, yeah, I know, very brave of me. I'm basically a digital monk now. [laughs] But now I don't know if my high school classmates are doing better than me, and honestly, that's terrifying. [big laugh]\n\nWithout Facebook, how am I supposed to feel superior to people I haven't talked to in 15 years? [laughter] I used to scroll through and think 'Oh look, Brad's still working at the gas station... I'm doing great!' [audience laughs] Now I have to actually evaluate my life based on my own achievements. It's horrible! [bigger laugh]\n\nAnd Instagram... Instagram is just people posting pictures of their food like they're running a restaurant. [scattered laughs] 'Here's my avocado toast!' Nobody cares, Karen! [laughter] I want to comment 'Congratulations on successfully operating a toaster.' [big laugh]\n\nBut the worst part about social media is LinkedIn. LinkedIn is like Facebook in a suit, pretending to be professional. [knowing laughs] People post like 'Thrilled to announce I had coffee this morning. #Blessed #Networking #CoffeeLife' [audience laughing] Just drink your coffee, Steve!",
    tags: ["social media", "technology", "millennial"],
    mood: "excited",
  },
]

// Mock data for performance trends
const performanceTrends = [
  { date: "2024-05-01", rating: 3.5, audience: 35 },
  { date: "2024-05-08", rating: 3.8, audience: 42 },
  { date: "2024-05-15", rating: 4.1, audience: 38 },
  { date: "2024-05-22", rating: 3.9, audience: 55 },
  { date: "2024-05-29", rating: 4.3, audience: 48 },
  { date: "2024-06-05", rating: 4.0, audience: 62 },
  { date: "2024-06-08", rating: 4.7, audience: 80 },
  { date: "2024-06-10", rating: 3.8, audience: 200 },
  { date: "2024-06-15", rating: 4.2, audience: 45 },
]

// Mock data for top performing jokes
const topJokes = [
  { joke: "Coffee order vs my soul", performance: "Open Mic Night", rating: 4.8, tags: ["observational", "dating"] },
  { joke: "Digital monk without Facebook", performance: "Weekend Showcase", rating: 4.7, tags: ["social media"] },
  { joke: "The cloud is in Ohio", performance: "Corporate Gig", rating: 4.5, tags: ["tech", "corporate"] },
]

export default function ProgressTracker() {
  const [selectedPerformanceId, setSelectedPerformanceId] = useState(mockPerformances[0].id)
  const [timePeriod, setTimePeriod] = useState("month")
  const [newNote, setNewNote] = useState("")
  const { user } = useAuth()
  const navigate = useNavigate()

  const selectedPerformance = mockPerformances.find((p) => p.id === selectedPerformanceId) || mockPerformances[0]

  const totalPerformances = mockPerformances.length
  const averageRating = (mockPerformances.reduce((sum, p) => sum + p.rating, 0) / totalPerformances).toFixed(1)
  const totalJokes = mockPerformances.reduce((sum, p) => sum + p.jokesCount, 0)
  const totalKills = mockPerformances.reduce((sum, p) => sum + p.killCount, 0)
  const totalBombs = mockPerformances.reduce((sum, p) => sum + p.bombCount, 0)
  const killBombRatio = totalBombs > 0 ? (totalKills / totalBombs).toFixed(1) : totalKills.toString()

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Progress Tracker</h1>
            <p className="text-muted-foreground">Track your comedy journey and improve your craft</p>
          </div>
          <Button className="gap-2 bg-papaya text-white hover:bg-papaya/80">
            <Plus className="w-4 h-4" />
            Add Performance
          </Button>
        </div>

        {/* Time Period Selector */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={timePeriod} onValueChange={setTimePeriod} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
                <TabsTrigger value="career">Career</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Performances</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPerformances}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating}</div>
              <p className="text-xs text-muted-foreground">+0.3 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jokes Told</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJokes}</div>
              <p className="text-xs text-muted-foreground">+12 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kill:Bomb Ratio</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{killBombRatio}:1</div>
              <p className="text-xs text-muted-foreground">+0.8 from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends and Top Jokes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Performance Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Your performance ratings and audience sizes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceChart />
            </CardContent>
          </Card>

          {/* Top Performing Jokes */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Jokes</CardTitle>
              <CardDescription>Your highest-rated material</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topJokes.map((joke, index) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm leading-tight">{joke.joke}</h4>
                      <div className="flex items-center gap-1 ml-2">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs font-medium">{joke.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{joke.performance}</p>
                    <div className="flex flex-wrap gap-1">
                      {joke.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Combined Performance Selector and Info */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <div className="text-xl font-bold mb-1">Performance Details</div>
              <div className="text-sm text-muted-foreground">Select and view detailed information about your performances</div>
            </div>
            <Select
              value={selectedPerformanceId.toString()}
              onValueChange={(value) => setSelectedPerformanceId(Number.parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockPerformances.map((performance) => (
                  <SelectItem key={performance.id} value={performance.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{performance.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {performance.venue} • {new Date(performance.date).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Performance Info */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{selectedPerformance.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedPerformance.venue}
                  </p>
                </div>
                <Badge
                  variant={
                    selectedPerformance.mood === "excited"
                      ? "default"
                      : selectedPerformance.mood === "confident"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {selectedPerformance.mood}
                </Badge>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <div className="text-sm font-medium">Date</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(selectedPerformance.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <div className="text-sm font-medium">Duration</div>
                  <div className="text-xs text-muted-foreground">{selectedPerformance.duration}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <div className="text-sm font-medium">Audience</div>
                  <div className="text-xs text-muted-foreground">{selectedPerformance.audienceSize} people</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Star className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <div className="text-sm font-medium">Rating</div>
                  <div className="text-xs text-muted-foreground">{selectedPerformance.rating}/5.0</div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Material Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedPerformance.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="transcript" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="transcript" className="space-y-4">
                  <div>
                    <div className="font-semibold text-base mb-2">Performance Transcript</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Full transcript from {selectedPerformance.title} at {selectedPerformance.venue}
                    </div>
                    <div className="bg-muted p-6 rounded-lg max-h-96 overflow-y-auto">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                        {selectedPerformance.transcript}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <div>
                    <div className="font-semibold text-base mb-2">Performance Notes</div>
                    <div className="text-xs text-muted-foreground mb-2">Your thoughts and observations from this performance</div>
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="text-sm leading-relaxed">{selectedPerformance.notes}</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="new-note" className="text-sm font-medium">
                        Add New Note
                      </Label>
                      <Textarea
                        id="new-note"
                        placeholder="What did you learn from this performance? Any new insights or areas for improvement?"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[120px]"
                      />
                      <Button size="sm" className="gap-2">
                        <Edit3 className="w-4 h-4" />
                        Save Note
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <div>
                    <div className="font-semibold text-base mb-2">Performance Analytics</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-lg font-semibold mb-2">Performance Metrics</div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Audience Size</span>
                          <span className="font-semibold">{selectedPerformance.audienceSize} people</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Performance Rating</span>
                          <span className="font-semibold">{selectedPerformance.rating}/5.0</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Total Jokes</span>
                          <span className="font-semibold">{selectedPerformance.jokesCount}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Kills vs Bombs</span>
                          <span className="font-semibold">
                            {selectedPerformance.killCount}:{selectedPerformance.bombCount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Set Duration</span>
                          <span className="font-semibold">{selectedPerformance.duration}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Performance Mood</span>
                          <Badge variant="outline">{selectedPerformance.mood}</Badge>
                        </div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-lg font-semibold mb-2">Material Analysis</div>
                        <span className="text-sm text-muted-foreground block mb-2">Content Categories</span>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedPerformance.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="pt-4 border-t">
                          <div className="text-sm text-muted-foreground mb-2">Performance Comparison</div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>vs. Average Rating</span>
                              <span
                                className={
                                  selectedPerformance.rating > Number.parseFloat(averageRating)
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {selectedPerformance.rating > Number.parseFloat(averageRating) ? "+" : ""}
                                {(selectedPerformance.rating - Number.parseFloat(averageRating)).toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>vs. Average Kill Rate</span>
                              <span className="text-green-600">
                                +{((selectedPerformance.killCount / selectedPerformance.jokesCount) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
