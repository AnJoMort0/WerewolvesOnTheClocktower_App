import { ROLES, ALL_ROLE_IDS, type RoleId } from "@/lib/roles";
import { useRoleLabel } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoleSelectorProps {
  value: RoleId;
  onChange: (role: RoleId) => void;
  advancedEnabled?: boolean;
}

export const RoleSelector = ({ value, onChange, advancedEnabled = true }: RoleSelectorProps) => {
  const roleLabel = useRoleLabel();
  const filteredIds = advancedEnabled
    ? ALL_ROLE_IDS
    : ALL_ROLE_IDS.filter((id) => ROLES[id].category !== "a" || id === value);

  return (
    <Select value={value} onValueChange={(v) => onChange(v as RoleId)}>
      <SelectTrigger className="w-[140px] h-8 text-xs font-display">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {filteredIds.map((id) => (
          <SelectItem key={id} value={id} className="text-xs font-display">
            <div className="flex items-center gap-2">
              <img src={ROLES[id].image} alt={roleLabel(id)} className="w-5 h-5 rounded" />
              {roleLabel(id)}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
