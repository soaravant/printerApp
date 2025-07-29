"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleBadge } from "@/components/role-badge"
import { User, Mail, Building, Shield, Calendar, Users, Church, MapPin, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { dummyDB } from "@/lib/dummy-database"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"


interface ProfilePageProps {
  params: Promise<{
    uid: string
  }>
}

export default function UserProfilePage({ params }: ProfilePageProps) {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [profileUser, setProfileUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Unwrap params using React.use() for Next.js 15 compatibility
  const unwrappedParams = use(params) as { uid: string }
  const uid = unwrappedParams.uid

  useEffect(() => {
    const allUsers = dummyDB.getUsers()
    const user = allUsers.find(u => u.uid === uid)
    
    if (user) {
      setProfileUser(user)
    } else {
      setNotFound(true)
    }
    setIsLoading(false)
  }, [uid])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                <div className="bg-white rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (notFound) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Χρήστης δεν βρέθηκε</h1>
                <p className="text-gray-600 mb-6">Ο χρήστης που αναζητάτε δεν υπάρχει ή δεν έχετε πρόσβαση.</p>
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Επιστροφή
                </Button>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!profileUser) return null

  // Function to get the appropriate icon based on user role
  const getRoleIcon = (userRole: string) => {
    switch (userRole) {
      case "Άτομο":
        return <User className="h-4 w-4" />;
      case "Ομάδα":
        return <Users className="h-4 w-4" />;
      case "Ναός":
        return <Church className="h-4 w-4" />;
      case "Τομέας":
        return <MapPin className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Function to get responsible users based on current user's role and members
  const getResponsibleUsers = () => {
    const allUsers = dummyDB.getUsers()
    const responsibleUsers: string[] = []
    
    // For users with "user" access level, find their team's responsible person through members field
    if (profileUser.accessLevel === "user" && profileUser.memberOf && profileUser.memberOf.length > 0) {
      // Find the first team in the memberOf list and get its responsible person
      const firstTeam = profileUser.memberOf.find((member: string) => {
        const teamAccount = allUsers.find(user => 
          user.userRole === "Ομάδα" && user.displayName === member
        )
        return teamAccount && teamAccount.responsiblePerson
      })
      
      if (firstTeam) {
        const teamAccount = allUsers.find(user => 
          user.userRole === "Ομάδα" && user.displayName === firstTeam
        )
        
        if (teamAccount && teamAccount.responsiblePerson) {
          responsibleUsers.push(teamAccount.responsiblePerson)
          return responsibleUsers
        }
      }
    }
    
    // For other cases (admin, Υπεύθυνος, or users without members), use the old logic
    const ypefthynoiUsers = allUsers.filter(user => user.accessLevel === "Υπεύθυνος")
    
    ypefthynoiUsers.forEach(ypefthynos => {
      if (ypefthynos.responsibleFor && ypefthynos.responsibleFor.length > 0) {
        const isResponsible = ypefthynos.responsibleFor.some(responsibleFor => {
          return responsibleFor === profileUser.displayName || 
                 responsibleFor === profileUser.userRole
        })
        
        if (isResponsible) {
          responsibleUsers.push(ypefthynos.displayName)
        }
      }
    })
    
    return responsibleUsers
  }



  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Επιστροφή
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Προφίλ: {profileUser.displayName}
                  </h1>
                  <p className="text-gray-600">
                    Προβολή στοιχείων χρήστη
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getRoleIcon(profileUser.userRole)}
                    Βασικές Πληροφορίες
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <User className="h-4 w-4" />
                      Username
                    </div>
                    <div className="text-lg font-mono bg-gray-50 p-3 rounded-lg">{profileUser.username}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <User className="h-4 w-4" />
                      Όνομα
                    </div>
                    <div className="text-lg bg-gray-50 p-3 rounded-lg">{profileUser.displayName}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      {getRoleIcon(profileUser.userRole)}
                      Ρόλος Χρήστη
                    </div>
                    <div className="text-lg bg-gray-50 p-3 rounded-lg">{profileUser.userRole}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Calendar className="h-4 w-4" />
                      Ημερομηνία Δημιουργίας
                    </div>
                    <div className="text-lg bg-gray-50 p-3 rounded-lg">
                      {profileUser.createdAt ? new Date(profileUser.createdAt).toLocaleDateString('el-GR') : 'Δεν διαθέσιμη'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Shield className="h-4 w-4" />
                      Επίπεδο Πρόσβασης
                    </div>
                    <div className="text-lg">
                      <RoleBadge accessLevel={profileUser.accessLevel} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role-Specific Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Πληροφορίες Ρόλου
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  {profileUser.memberOf && profileUser.memberOf.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Users className="h-4 w-4" />
                        Μέλος
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profileUser.memberOf.map((member: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const responsibleUsers = getResponsibleUsers()
                    return responsibleUsers.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                          <Users className="h-4 w-4" />
                          Υπεύθυνοι
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {responsibleUsers.map((responsible: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-sm">
                              {responsible}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null
                  })()}

                  {profileUser.accessLevel === "Υπεύθυνος" && profileUser.responsibleFor && profileUser.responsibleFor.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Shield className="h-4 w-4" />
                        Υπεύθυνος για:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profileUser.responsibleFor.map((responsibleFor: string, index: number) => (
                          <Badge key={index} variant="default" className="text-sm">
                            {responsibleFor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>


            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
} 