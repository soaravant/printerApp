"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleBadge } from "@/components/role-badge"
import { User, Mail, Building, Shield, Calendar, Users, Church, MapPin, ArrowLeft, Edit, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { dummyDB } from "@/lib/dummy-database"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { TagInput } from "@/components/ui/tag-input"


interface ProfilePageProps {
  params: Promise<{
    uid: string
  }>
}

export default function UserProfilePage({ params }: ProfilePageProps) {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profileUser, setProfileUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedUser, setEditedUser] = useState<any>(null)

  // Unwrap params using React.use() for Next.js 15 compatibility
  const unwrappedParams = use(params) as { uid: string }
  const uid = unwrappedParams.uid

  useEffect(() => {
    const allUsers = dummyDB.getUsers()
    const user = allUsers.find(u => u.uid === uid)
    
    if (user) {
      setProfileUser(user)
      setEditedUser({ ...user }) // Create a copy for editing
    } else {
      setNotFound(true)
    }
    setIsLoading(false)
  }, [uid])

  const handleEdit = () => {
    setIsEditMode(true)
    setEditedUser({ ...profileUser })
  }

  const handleCancel = () => {
    setIsEditMode(false)
    setEditedUser({ ...profileUser })
  }

  const handleSave = () => {
    try {
      // Update the user in the database
      dummyDB.updateUser(editedUser)
      
      // Update local state
      setProfileUser(editedUser)
      setIsEditMode(false)
      
      toast({
        title: "Επιτυχία",
        description: "Τα στοιχεία του χρήστη ενημερώθηκαν επιτυχώς.",
      })
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Προέκυψε σφάλμα κατά την ενημέρωση των στοιχείων.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setEditedUser((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  // Helper functions to get available options for TagInput
  const getAvailableMembers = () => {
    const allUsers = dummyDB.getUsers()
    return allUsers
      .filter(u => u.userRole !== "Άτομο")
      .map(u => u.displayName)
  }

  const getAvailableResponsibleFor = () => {
    const allUsers = dummyDB.getUsers()
    return allUsers
      .filter(u => u.userRole !== "Άτομο")
      .map(u => u.displayName)
  }

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
    
    // For users with "Χρήστης" access level, find their team's responsible person through members field
    if (profileUser.accessLevel === "Χρήστης" && profileUser.memberOf && profileUser.memberOf.length > 0) {
      // Find the first team in the memberOf list and then find Υπεύθυνοι responsible for that team
      const firstTeam = profileUser.memberOf.find((member: string) => {
        return allUsers.some(user => user.userRole === "Ομάδα" && user.displayName === member)
      })
      if (firstTeam) {
        const teamResponsibleUsers = allUsers
          .filter((u: any) => u.accessLevel === "Υπεύθυνος" && Array.isArray(u.responsibleFor) && u.responsibleFor.includes(firstTeam))
          .map((u: any) => u.displayName)
        if (teamResponsibleUsers.length > 0) {
          responsibleUsers.push(...teamResponsibleUsers)
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
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
                      {isEditMode ? "Επεξεργασία στοιχείων χρήστη" : "Προβολή στοιχείων χρήστη"}
                    </p>
                  </div>
                </div>
                
                {/* Edit/Save/Cancel buttons for admin */}
                {currentUser?.accessLevel === "Διαχειριστής" && (
                  <div className="flex items-center gap-2">
                                         {!isEditMode ? (
                       <Button onClick={handleEdit} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                         <Edit className="h-4 w-4" />
                         Επεξεργασία
                       </Button>
                    ) : (
                      <>
                        <Button onClick={handleSave} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                          <Save className="h-4 w-4" />
                          Αποθήκευση
                        </Button>
                        <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
                          <X className="h-4 w-4" />
                          Ακύρωση
                        </Button>
                      </>
                    )}
                  </div>
                )}
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
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    {isEditMode ? (
                      <Input
                        value={editedUser.username || ''}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className="text-lg font-mono"
                      />
                    ) : (
                      <div className="text-lg font-mono bg-gray-50 p-3 rounded-lg">{profileUser.username}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <User className="h-4 w-4" />
                      Όνομα
                    </Label>
                    {isEditMode ? (
                      <Input
                        value={editedUser.displayName || ''}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className="text-lg"
                      />
                    ) : (
                      <div className="text-lg bg-gray-50 p-3 rounded-lg">{profileUser.displayName}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      {getRoleIcon(profileUser.userRole)}
                      Ρόλος Χρήστη
                    </Label>
                    {isEditMode ? (
                      <Select
                        value={editedUser.userRole || ''}
                        onValueChange={(value) => handleInputChange('userRole', value)}
                      >
                        <SelectTrigger className="text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Άτομο">Άτομο</SelectItem>
                          <SelectItem value="Ομάδα">Ομάδα</SelectItem>
                          <SelectItem value="Ναός">Ναός</SelectItem>
                          <SelectItem value="Τομέας">Τομέας</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-lg bg-gray-50 p-3 rounded-lg">{profileUser.userRole}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Calendar className="h-4 w-4" />
                      Ημερομηνία Δημιουργίας
                    </Label>
                    <div className="text-lg bg-gray-50 p-3 rounded-lg">
                      {profileUser.createdAt ? new Date(profileUser.createdAt).toLocaleDateString('el-GR') : 'Δεν διαθέσιμη'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Shield className="h-4 w-4" />
                      Επίπεδο Πρόσβασης
                    </Label>
                    {isEditMode ? (
                        <Select
                        value={editedUser.accessLevel || ''}
                        onValueChange={(value) => handleInputChange('accessLevel', value)}
                      >
                        <SelectTrigger className="text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Χρήστης">Χρήστης</SelectItem>
                          <SelectItem value="Υπεύθυνος">Υπεύθυνος</SelectItem>
                          <SelectItem value="Διαχειριστής">Διαχειριστής</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-lg">
                         <RoleBadge accessLevel={profileUser.accessLevel as any} />
                      </div>
                    )}
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



                  {(() => {
                    const responsibleUsers = getResponsibleUsers()
                    return responsibleUsers.length > 0 ? (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                          <Users className="h-4 w-4" />
                          Υπεύθυνοι
                        </Label>
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

                                     {/* Show memberOf field for Άτομο users, even if empty */}
                   {profileUser.userRole === "Άτομο" && (
                     <div className="space-y-2">
                       <Label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                         <Users className="h-4 w-4" />
                         Μέλος σε:
                       </Label>
                       {isEditMode ? (
                         <TagInput
                           tags={editedUser.memberOf || []}
                           onTagsChange={(memberOf) => handleInputChange('memberOf', memberOf)}
                           placeholder="Προσθήκη Ομάδας/Ναού/Τομέα..."
                           availableOptions={getAvailableMembers()}
                           maxTags={5}
                         />
                       ) : (
                         <div className="flex flex-wrap gap-2">
                           {profileUser.memberOf && profileUser.memberOf.length > 0 ? (
                             profileUser.memberOf.map((member: string, index: number) => (
                               <Badge key={index} variant="outline" className="text-sm">
                                 {member}
                               </Badge>
                             ))
                           ) : (
                             <span className="text-gray-500 text-sm">Δεν είναι μέλος σε κάποια ομάδα</span>
                           )}
                         </div>
                       )}
                     </div>
                   )}

                                     {/* Show responsibleFor field for Υπεύθυνος users, even if empty */}
                   {profileUser.accessLevel === "Υπεύθυνος" && (
                     <div className="space-y-2">
                       <Label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                         <Shield className="h-4 w-4" />
                         Υπεύθυνος για:
                       </Label>
                       {isEditMode ? (
                         <TagInput
                           tags={editedUser.responsibleFor || []}
                           onTagsChange={(responsibleFor) => handleInputChange('responsibleFor', responsibleFor)}
                           placeholder="Προσθήκη Ομάδας/Ναού/Τομέα..."
                           availableOptions={getAvailableResponsibleFor()}
                           maxTags={5}
                         />
                       ) : (
                         <div className="flex flex-wrap gap-2">
                           {profileUser.responsibleFor && profileUser.responsibleFor.length > 0 ? (
                             profileUser.responsibleFor.map((responsibleFor: string, index: number) => (
                               <Badge key={index} variant="default" className="text-sm">
                                 {responsibleFor}
                               </Badge>
                             ))
                           ) : (
                             <span className="text-gray-500 text-sm">Δεν είναι υπεύθυνος για κάποια ομάδα</span>
                           )}
                         </div>
                       )}
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