import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building, Printer, Search } from "lucide-react";
import { roundMoney } from "@/lib/utils";

interface AdminUsersTabProps {
  users: any[];
  usersTabSearchTerm: string;
  setUsersTabSearchTerm: (v: string) => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
  teamFilter: string;
  setTeamFilter: (v: string) => void;
  filteredUsers: any[];
  formatPrice: (n: number) => string;
  dummyDB: any;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  usersTabSearchTerm,
  setUsersTabSearchTerm,
  roleFilter,
  setRoleFilter,
  teamFilter,
  setTeamFilter,
  filteredUsers,
  formatPrice,
  dummyDB,
}) => {
  return (
    <div>
      {/* Filters UI */}
      <div className="mb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="flex-1 flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Αναζήτηση χρηστών..."
                value={usersTabSearchTerm}
                onChange={(e) => setUsersTabSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-60 flex items-center">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλοι οι ρόλοι</SelectItem>
                <SelectItem value="Άτομο">Άτομο</SelectItem>
                <SelectItem value="Ομάδα">Ομάδα</SelectItem>
                <SelectItem value="Ναός">Ναός</SelectItem>
                <SelectItem value="Τομέας">Τομέας</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(roleFilter === "all" || roleFilter === "Άτομο") && (
            <div className="w-full md:w-60 flex items-center">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Όλες οι ομάδες" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλες οι ομάδες</SelectItem>
                  <SelectItem value="Ενωμένοι">Ενωμένοι</SelectItem>
                  <SelectItem value="Σποριάδες">Σποριάδες</SelectItem>
                  <SelectItem value="Καρποφόροι">Καρποφόροι</SelectItem>
                  <SelectItem value="Ολόφωτοι">Ολόφωτοι</SelectItem>
                  <SelectItem value="Νικητές">Νικητές</SelectItem>
                  <SelectItem value="Νικηφόροι">Νικηφόροι</SelectItem>
                  <SelectItem value="Φλόγα">Φλόγα</SelectItem>
                  <SelectItem value="Σύμψυχοι">Σύμψυχοι</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-4">
        Εμφανίζονται {filteredUsers.length} από {users.length} χρήστες
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((userData) => {
          const printBilling = dummyDB.getPrintBilling(userData.uid);
          const laminationBilling = dummyDB.getLaminationBilling(userData.uid);
          const printUnpaid = printBilling.filter((b: any) => !b.paid).reduce((sum: number, b: any) => sum + b.remainingBalance, 0);
          const laminationUnpaid = laminationBilling.filter((b: any) => !b.paid).reduce((sum: number, b: any) => sum + b.remainingBalance, 0);
          const totalUnpaid = printUnpaid + laminationUnpaid;
          return (
            <Card key={userData.uid} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {userData.displayName}
                  </div>
                  <Badge variant={userData.accessLevel === "admin" ? "default" : "secondary"}>
                    {userData.accessLevel === "admin" ? "Admin" : "User"}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {userData.userRole}
                  {userData.team && (
                    <span className="text-blue-600 font-medium">• {userData.team}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Username:</span>
                    <span className="font-mono">{userData.username}</span>
                  </div>

                  {userData.responsiblePerson && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Υπεύθυνος:</span>
                      <span className="text-sm">{userData.responsiblePerson}</span>
                    </div>
                  )}
                </div>
                {userData.accessLevel === "user" && (
                  <div className="border-t pt-4 mt-auto">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Οφειλές</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Printer className="h-3 w-3" /> Εκτυπώσεις:
                        </span>
                        <span className={printUnpaid > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                          {formatPrice(printUnpaid)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Printer className="h-3 w-3" /> Πλαστικοποιήσεις:
                        </span>
                        <span className={laminationUnpaid > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                          {formatPrice(laminationUnpaid)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="font-medium">Σύνολο:</span>
                        <span className={totalUnpaid > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                          {formatPrice(roundMoney(printUnpaid + laminationUnpaid))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 