import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AppliesTo } from "../../src/domain/reference-content";
import {
  adminDeleteLaserType,
  adminDeleteProviderService,
  adminDeleteServiceType,
  adminDeleteTreatmentArea,
  adminInsertLaserType,
  adminInsertProviderService,
  adminInsertServiceType,
  adminInsertTreatmentArea,
  adminListLaserTypes,
  adminListProviderServices,
  adminListServiceTypes,
  adminListTreatmentAreas,
  adminUpdateLaserType,
  adminUpdateProviderService,
  adminUpdateServiceType,
  adminUpdateTreatmentArea,
  type AdminLaserTypeRow,
  type AdminProviderServiceRow,
  type AdminServiceTypeRow,
  type AdminTreatmentAreaRow,
} from "../../src/repositories/catalog-admin.repository";
import { fetchOwnProfileRow } from "../../src/repositories/profile.repository";
import { appStrings } from "../../src/strings/appStrings";
import { colors } from "../../src/theme/tokens";

type Tab = "laser" | "service" | "area" | "provider";

export default function CatalogAdminScreen() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("laser");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lasers, setLasers] = useState<AdminLaserTypeRow[]>([]);
  const [services, setServices] = useState<AdminServiceTypeRow[]>([]);
  const [areas, setAreas] = useState<AdminTreatmentAreaRow[]>([]);
  const [provSvcs, setProvSvcs] = useState<AdminProviderServiceRow[]>([]);

  const gate = useCallback(async () => {
    const p = await fetchOwnProfileRow();
    setAllowed(Boolean(p?.is_admin));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void gate();
    }, [gate]),
  );

  const load = useCallback(async () => {
    if (!allowed) {
      return;
    }
    setLoading(true);
    try {
      if (tab === "laser") {
        setLasers(await adminListLaserTypes());
      } else if (tab === "service") {
        setServices(await adminListServiceTypes());
      } else if (tab === "area") {
        setAreas(await adminListTreatmentAreas());
      } else {
        setProvSvcs(await adminListProviderServices());
      }
    } catch (e) {
      Alert.alert("Load failed", e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [allowed, tab]);

  useEffect(() => {
    if (allowed) {
      void load();
    }
  }, [allowed, tab, load]);

  const onAdd = async () => {
    try {
      if (tab === "laser") {
        await adminInsertLaserType();
      } else if (tab === "service") {
        await adminInsertServiceType();
      } else if (tab === "area") {
        await adminInsertTreatmentArea();
      } else {
        await adminInsertProviderService();
      }
      await load();
    } catch (e) {
      Alert.alert("Could not add", e instanceof Error ? e.message : String(e));
    }
  };

  if (allowed === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primaryNavy} />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.padded}>
        <Text style={styles.denied}>{appStrings.catalogAdminAccessDenied}</Text>
        <Text style={styles.hint}>{appStrings.catalogAdminHint}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Text style={styles.topHint}>{appStrings.catalogAdminHint}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {(
          [
            ["laser", appStrings.catalogAdminLaserTab],
            ["service", appStrings.catalogAdminServiceTab],
            ["area", appStrings.catalogAdminAreaTab],
            ["provider", appStrings.catalogAdminProviderTab],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabOn]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.addBtn} onPress={() => void onAdd()}>
        <Text style={styles.addBtnText}>{appStrings.catalogAdminAddRow}</Text>
      </Pressable>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryNavy} />
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {tab === "laser"
            ? lasers.map((r) => (
                <LaserEditor
                  key={r.id}
                  row={r}
                  saving={savingId === r.id}
                  onSave={async (patch) => {
                    setSavingId(r.id);
                    try {
                      await adminUpdateLaserType(r.id, patch);
                      await load();
                    } catch (e) {
                      Alert.alert("Save failed", e instanceof Error ? e.message : String(e));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  onDelete={() => {
                    Alert.alert(
                      appStrings.catalogAdminDeleteConfirmTitle,
                      appStrings.catalogAdminDeleteConfirmBody,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: appStrings.catalogAdminDelete,
                          style: "destructive",
                          onPress: () => {
                            void (async () => {
                              try {
                                await adminDeleteLaserType(r.id);
                                await load();
                              } catch (e) {
                                Alert.alert("Delete failed", e instanceof Error ? e.message : String(e));
                              }
                            })();
                          },
                        },
                      ],
                    );
                  }}
                />
              ))
            : null}
          {tab === "service"
            ? services.map((r) => (
                <ServiceEditor
                  key={r.id}
                  row={r}
                  saving={savingId === r.id}
                  onSave={async (patch) => {
                    setSavingId(r.id);
                    try {
                      await adminUpdateServiceType(r.id, patch);
                      await load();
                    } catch (e) {
                      Alert.alert("Save failed", e instanceof Error ? e.message : String(e));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  onDelete={() => {
                    Alert.alert(
                      appStrings.catalogAdminDeleteConfirmTitle,
                      appStrings.catalogAdminDeleteConfirmBody,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: appStrings.catalogAdminDelete,
                          style: "destructive",
                          onPress: () => {
                            void (async () => {
                              try {
                                await adminDeleteServiceType(r.id);
                                await load();
                              } catch (e) {
                                Alert.alert("Delete failed", e instanceof Error ? e.message : String(e));
                              }
                            })();
                          },
                        },
                      ],
                    );
                  }}
                />
              ))
            : null}
          {tab === "area"
            ? areas.map((r) => (
                <AreaEditor
                  key={r.id}
                  row={r}
                  saving={savingId === r.id}
                  onSave={async (patch) => {
                    setSavingId(r.id);
                    try {
                      await adminUpdateTreatmentArea(r.id, patch);
                      await load();
                    } catch (e) {
                      Alert.alert("Save failed", e instanceof Error ? e.message : String(e));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  onDelete={() => {
                    Alert.alert(
                      appStrings.catalogAdminDeleteConfirmTitle,
                      appStrings.catalogAdminDeleteConfirmBody,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: appStrings.catalogAdminDelete,
                          style: "destructive",
                          onPress: () => {
                            void (async () => {
                              try {
                                await adminDeleteTreatmentArea(r.id);
                                await load();
                              } catch (e) {
                                Alert.alert("Delete failed", e instanceof Error ? e.message : String(e));
                              }
                            })();
                          },
                        },
                      ],
                    );
                  }}
                />
              ))
            : null}
          {tab === "provider"
            ? provSvcs.map((r) => (
                <ProviderSvcEditor
                  key={r.id}
                  row={r}
                  saving={savingId === r.id}
                  onSave={async (patch) => {
                    setSavingId(r.id);
                    try {
                      await adminUpdateProviderService(r.id, patch);
                      await load();
                    } catch (e) {
                      Alert.alert("Save failed", e instanceof Error ? e.message : String(e));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  onDelete={() => {
                    Alert.alert(
                      appStrings.catalogAdminDeleteConfirmTitle,
                      appStrings.catalogAdminDeleteConfirmBody,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: appStrings.catalogAdminDelete,
                          style: "destructive",
                          onPress: () => {
                            void (async () => {
                              try {
                                await adminDeleteProviderService(r.id);
                                await load();
                              } catch (e) {
                                Alert.alert("Delete failed", e instanceof Error ? e.message : String(e));
                              }
                            })();
                          },
                        },
                      ],
                    );
                  }}
                />
              ))
            : null}
        </ScrollView>
      )}
    </View>
  );
}

function LaserEditor({
  row,
  saving,
  onSave,
  onDelete,
}: {
  row: AdminLaserTypeRow;
  saving: boolean;
  onSave: (p: Partial<AdminLaserTypeRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description);
  const [sort, setSort] = useState(String(row.sort_order));
  const [active, setActive] = useState(row.is_active);
  const [def, setDef] = useState(row.is_default);

  useEffect(() => {
    setName(row.name);
    setDescription(row.description);
    setSort(String(row.sort_order));
    setActive(row.is_active);
    setDef(row.is_default);
  }, [row]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Sort order</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
        placeholderTextColor={colors.textLight}
      />
      <View style={styles.switchRow}>
        <Text>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View style={styles.switchRow}>
        <Text>Default</Text>
        <Switch value={def} onValueChange={setDef} />
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() =>
            void onSave({
              name: name.trim(),
              description: description.trim(),
              sort_order: Number.parseInt(sort, 10) || 0,
              is_active: active,
              is_default: def,
            })
          }
        >
          {saving ? <ActivityIndicator color={colors.primaryNavy} /> : <Text style={styles.saveBtnText}>{appStrings.catalogAdminSave}</Text>}
        </Pressable>
        <Pressable style={styles.delBtn} onPress={onDelete}>
          <Text style={styles.delBtnText}>{appStrings.catalogAdminDelete}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ServiceEditor({
  row,
  saving,
  onSave,
  onDelete,
}: {
  row: AdminServiceTypeRow;
  saving: boolean;
  onSave: (p: Partial<AdminServiceTypeRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description);
  const [applies, setApplies] = useState<AppliesTo>(row.applies_to);
  const [sort, setSort] = useState(String(row.sort_order));
  const [active, setActive] = useState(row.is_active);
  const [def, setDef] = useState(row.is_default);

  useEffect(() => {
    setName(row.name);
    setDescription(row.description);
    setApplies(row.applies_to);
    setSort(String(row.sort_order));
    setActive(row.is_active);
    setDef(row.is_default);
  }, [row]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Applies to</Text>
      <View style={styles.chips}>
        {(["injectable", "laser", "both"] as const).map((k) => (
          <Pressable key={k} style={[styles.chip, applies === k && styles.chipOn]} onPress={() => setApplies(k)}>
            <Text style={[styles.chipText, applies === k && styles.chipTextOn]}>
              {k === "injectable"
                ? appStrings.appliesToInjectable
                : k === "laser"
                  ? appStrings.appliesToLaser
                  : appStrings.appliesToBoth}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.cardLabel}>Sort order</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
        placeholderTextColor={colors.textLight}
      />
      <View style={styles.switchRow}>
        <Text>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View style={styles.switchRow}>
        <Text>Default</Text>
        <Switch value={def} onValueChange={setDef} />
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() =>
            void onSave({
              name: name.trim(),
              description: description.trim(),
              applies_to: applies,
              sort_order: Number.parseInt(sort, 10) || 0,
              is_active: active,
              is_default: def,
            })
          }
        >
          {saving ? <ActivityIndicator color={colors.primaryNavy} /> : <Text style={styles.saveBtnText}>{appStrings.catalogAdminSave}</Text>}
        </Pressable>
        <Pressable style={styles.delBtn} onPress={onDelete}>
          <Text style={styles.delBtnText}>{appStrings.catalogAdminDelete}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AreaEditor({
  row,
  saving,
  onSave,
  onDelete,
}: {
  row: AdminTreatmentAreaRow;
  saving: boolean;
  onSave: (p: Partial<AdminTreatmentAreaRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [category, setCategory] = useState(row.category);
  const [sort, setSort] = useState(String(row.sort_order));
  const [active, setActive] = useState(row.is_active);
  const [def, setDef] = useState(row.is_default);

  useEffect(() => {
    setName(row.name);
    setCategory(row.category);
    setSort(String(row.sort_order));
    setActive(row.is_active);
    setDef(row.is_default);
  }, [row]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Category</Text>
      <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Sort order</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
        placeholderTextColor={colors.textLight}
      />
      <View style={styles.switchRow}>
        <Text>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View style={styles.switchRow}>
        <Text>Default</Text>
        <Switch value={def} onValueChange={setDef} />
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() =>
            void onSave({
              name: name.trim(),
              category: category.trim(),
              sort_order: Number.parseInt(sort, 10) || 0,
              is_active: active,
              is_default: def,
            })
          }
        >
          {saving ? <ActivityIndicator color={colors.primaryNavy} /> : <Text style={styles.saveBtnText}>{appStrings.catalogAdminSave}</Text>}
        </Pressable>
        <Pressable style={styles.delBtn} onPress={onDelete}>
          <Text style={styles.delBtnText}>{appStrings.catalogAdminDelete}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProviderSvcEditor({
  row,
  saving,
  onSave,
  onDelete,
}: {
  row: AdminProviderServiceRow;
  saving: boolean;
  onSave: (p: Partial<AdminProviderServiceRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description);
  const [sort, setSort] = useState(String(row.sort_order));
  const [active, setActive] = useState(row.is_active);
  const [def, setDef] = useState(row.is_default);

  useEffect(() => {
    setName(row.name);
    setDescription(row.description);
    setSort(String(row.sort_order));
    setActive(row.is_active);
    setDef(row.is_default);
  }, [row]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Sort order</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
        placeholderTextColor={colors.textLight}
      />
      <View style={styles.switchRow}>
        <Text>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View style={styles.switchRow}>
        <Text>Default</Text>
        <Switch value={def} onValueChange={setDef} />
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() =>
            void onSave({
              name: name.trim(),
              description: description.trim(),
              sort_order: Number.parseInt(sort, 10) || 0,
              is_active: active,
              is_default: def,
            })
          }
        >
          {saving ? <ActivityIndicator color={colors.primaryNavy} /> : <Text style={styles.saveBtnText}>{appStrings.catalogAdminSave}</Text>}
        </Pressable>
        <Pressable style={styles.delBtn} onPress={onDelete}>
          <Text style={styles.delBtnText}>{appStrings.catalogAdminDelete}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  padded: { flex: 1, padding: 20, backgroundColor: colors.lightGray },
  denied: { fontSize: 16, fontWeight: "600", color: colors.primaryNavy, marginBottom: 12 },
  hint: { color: colors.textSecondary, lineHeight: 22 },
  topHint: { padding: 12, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  tabs: { maxHeight: 48, paddingHorizontal: 8, marginBottom: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabOn: { backgroundColor: colors.primaryGold, borderColor: colors.primaryGold },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  tabTextOn: { color: colors.primaryNavy },
  addBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.primaryNavy,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addBtnText: { color: colors.cleanWhite, textAlign: "center", fontWeight: "700" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primaryGold,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveBtnText: { fontWeight: "700", color: colors.primaryNavy },
  delBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.errorRed,
    justifyContent: "center",
  },
  delBtnText: { color: colors.errorRed, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chipOn: { backgroundColor: colors.primaryGold, borderColor: colors.primaryGold },
  chipText: { fontSize: 13, color: colors.textPrimary, fontWeight: "500" },
  chipTextOn: { color: colors.primaryNavy },
});
