import { PHONE_MODE } from "@/lib/phoneActionModes";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NightScript } from "@/components/game/NightScript";
import { getRoleLabel, LanguageContext } from "@/lib/i18n";
import { EMPTY_ACTOR_POWER_STATE } from "@/lib/actor";
import { createDogWolfState } from "@/lib/dogWolf";

const baseProps = {
  activeRoles: new Set(["e02" as const]),
  permanentlyDead: new Set<string>(),
  poisonedPlayerId: null,
  illusionPlayerId: null,
  roleAssignments: { witch: "e02" as const },
  nightNumber: 2,
  onEndNight: vi.fn(),
  shamanCharges: 0,
  onShamanChargeToggle: vi.fn(),
  lastNightDeadPlayerIds: [],
  players: [{ id: "witch", name: "Witch", seat_position: 0 }],
  foxDisabled: false,
  onFoxDisabledToggle: vi.fn(),
  nightTargetedPlayerIds: new Set<string>(),
};

const phoneModeSelector = (mode: string) => `[data-phone-mode="${mode}"]`;

describe("NightScript phone controls", () => {
  it("opens Sleepwalker and Priest actions, but not a poisoned Priest action", () => {
    const onPhoneToggle = vi.fn();
    const props = { ...baseProps, nightNumber: 3,
      activeRoles: new Set(["v16" as const, "v25" as const]),
      roleAssignments: { sleepwalker: "v16" as const, priest: "v25" as const },
      abilityRoleAssignments: { sleepwalker: "v16" as const, priest: "v25" as const },
      players: [{ id: "sleepwalker", name: "Sleepwalker", seat_position: 0 }, { id: "priest", name: "Priest", seat_position: 1 }],
      onPhoneToggle };
    const { container, rerender } = render(<LanguageContext.Provider value="en"><NightScript {...props} /></LanguageContext.Provider>);
    const visit = container.querySelector<HTMLButtonElement>(phoneModeSelector(PHONE_MODE.SLEEPWALKER_VISIT))!;
    const confession = container.querySelector<HTMLButtonElement>(phoneModeSelector(PHONE_MODE.PRIEST_CONFESSION))!;
    expect(visit.querySelector(".lucide-moon")).toBeInTheDocument();
    expect(confession.querySelector(".lucide-church")).toBeInTheDocument();
    fireEvent.click(visit);
    fireEvent.click(confession);
    expect(onPhoneToggle).toHaveBeenCalledWith(PHONE_MODE.SLEEPWALKER_VISIT, expect.any(String), "sleepwalker", expect.any(Number));
    expect(onPhoneToggle).toHaveBeenCalledWith(PHONE_MODE.PRIEST_CONFESSION, expect.any(String), "priest", expect.any(Number));

    rerender(<LanguageContext.Provider value="en"><NightScript {...props}
      poisonedPlayerId="priest" poisonedPlayerIds={new Set(["priest"])} /></LanguageContext.Provider>);
    expect(container.querySelector(phoneModeSelector(PHONE_MODE.PRIEST_CONFESSION))).not.toBeInTheDocument();
    expect(container.querySelector(phoneModeSelector(PHONE_MODE.SLEEPWALKER_VISIT))).toBeInTheDocument();
  });

  it("opens the first Spider web and only the copied Spider whose own web needs replacement", () => {
    const onPhoneToggle = vi.fn();
    const firstProps = { ...baseProps, nightNumber: 1, activeRoles: new Set(["v23" as const]),
      roleAssignments: { spider: "v23" as const }, abilityRoleAssignments: { spider: "v23" as const },
      players: [{ id: "spider", name: "Spider", seat_position: 0 }], onPhoneToggle };
    const { container, rerender } = render(<LanguageContext.Provider value="en"><NightScript {...firstProps} /></LanguageContext.Provider>);
    const firstControl = container.querySelector<HTMLButtonElement>(phoneModeSelector(PHONE_MODE.SPIDER_TAMER_WEB))!;
    expect(firstControl.querySelector(".lucide-waypoints")).toBeInTheDocument();
    fireEvent.click(firstControl);
    expect(onPhoneToggle).toHaveBeenLastCalledWith(PHONE_MODE.SPIDER_TAMER_WEB, expect.any(String), "spider", null);

    const copiedProps = { ...baseProps, nightNumber: 3,
      activeRoles: new Set(["v23" as const, "a03" as const, "a04" as const, "a02" as const]),
      roleAssignments: { spider: "v23" as const, actor: "v23" as const, mime: "a03" as const, dog: "v23" as const },
      baseRoleAssignments: { spider: "v23" as const, actor: "a04" as const, mime: "a03" as const, dog: "a02" as const },
      abilityRoleAssignments: { spider: "v23" as const, actor: "v23" as const, mime: "v23" as const, dog: "v23" as const },
      actorPlayerId: "actor", actorCopiedRole: "v23" as const, actorCopyNoticeNight: 1,
      mimePlayerId: "mime", mimeMechanicalRole: "v23" as const,
      dogWolfPlayerIds: ["dog"], dogWolfStates: { dog: createDogWolfState("spider") },
      players: ["spider", "actor", "mime", "dog"].map((id, seat_position) => ({ id, name: id, seat_position })),
      conditionKeys: { spiderWebbedDied: true }, deathTriggeredSourcePlayerIds: { spiderWebbedDied: ["mime"] }, onPhoneToggle };
    rerender(<LanguageContext.Provider value="en"><NightScript {...copiedProps} /></LanguageContext.Provider>);
    const replacementControls = Array.from(container.querySelectorAll<HTMLButtonElement>(phoneModeSelector(PHONE_MODE.SPIDER_TAMER_WEB)));
    expect(replacementControls).toHaveLength(1);
    fireEvent.click(replacementControls[0]);
    expect(onPhoneToggle).toHaveBeenLastCalledWith(PHONE_MODE.SPIDER_TAMER_WEB, expect.any(String), "mime", expect.any(Number));
  });

  it("only renders Colossus retaliation sources attacked by Werewolves", () => {
    const onPhoneToggle = vi.fn(), onLineCompletedChange = vi.fn();
    const props = { ...baseProps, nightNumber: 3, colossusNightSeed: 0.29,
      activeRoles: new Set(["e01" as const, "v27" as const, "a04" as const, "a03" as const, "a02" as const]),
      roleAssignments: { wolf: "e01" as const, colossus: "v27" as const, actor: "v27" as const, mime: "a03" as const, dog: "v27" as const },
      baseRoleAssignments: { wolf: "e01" as const, colossus: "v27" as const, actor: "a04" as const, mime: "a03" as const, dog: "a02" as const },
      abilityRoleAssignments: { wolf: "e01" as const, colossus: "v27" as const, actor: "v27" as const, mime: "v27" as const, dog: "v27" as const },
      actorPlayerId: "actor", actorCopiedRole: "v27" as const, mimePlayerId: "mime", mimeMechanicalRole: "v27" as const,
      dogWolfPlayerIds: ["dog"], dogWolfStates: { dog: createDogWolfState("colossus") },
      players: ["wolf", "colossus", "actor", "mime", "dog"].map((id, seat_position) => ({ id, name: id, seat_position })),
      onPhoneToggle, onLineCompletedChange };
    const { container, rerender } = render(<LanguageContext.Provider value="en"><NightScript {...props} /></LanguageContext.Provider>);
    expect(container.querySelectorAll(phoneModeSelector(PHONE_MODE.COLOSSUS_RETALIATION))).toHaveLength(0);
    rerender(<LanguageContext.Provider value="en"><NightScript {...props}
      conditionKeys={{ colossusAttacked: true }} deathTriggeredSourcePlayerIds={{ colossusAttacked: ["actor", "mime", "dog"] }} /></LanguageContext.Provider>);
    const controls = Array.from(container.querySelectorAll<HTMLButtonElement>(phoneModeSelector(PHONE_MODE.COLOSSUS_RETALIATION)));
    expect(controls).toHaveLength(3);
    controls.forEach((control) => fireEvent.click(control));
    expect(onPhoneToggle.mock.calls.map(([, , id]) => id)).toEqual(expect.arrayContaining(["actor", "mime", "dog"]));
    expect(onLineCompletedChange).not.toHaveBeenCalled();
    const hunt = container.querySelector(phoneModeSelector(PHONE_MODE.WEREWOLF_HUNT))!;
    controls.forEach((control) => {
      expect(hunt.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
      fireEvent.dragStart(control.closest('[draggable="true"]')!, { dataTransfer });
      expect(dataTransfer.setData).toHaveBeenCalledWith("action", "role-v27");
      expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", expect.stringMatching(/actor|mime|dog/));
    });
    expect(container.textContent).not.toContain("Killed by the Actor");
  });

  it("captures the actors on completed lines and includes the Puppeteer in a pack turn", () => {
    const onLineCompletedChange = vi.fn(), onScriptLinesChange = vi.fn();
    const { container } = render(<LanguageContext.Provider value="en"><NightScript {...baseProps} nightNumber={3}
      activeRoles={new Set(["e01", "v06", "e02"])} roleAssignments={{ wolf: "e01", puppet: "v06", witch: "e02" }}
      players={[{ id: "wolf", name: "Wolf", seat_position: 0 }, { id: "puppet", name: "Puppet", seat_position: 1 }, { id: "witch", name: "Witch", seat_position: 2 }]}
      onPhoneToggle={vi.fn()} onLineCompletedChange={onLineCompletedChange} onScriptLinesChange={onScriptLinesChange} /></LanguageContext.Provider>);
    const hunt = container.querySelector(phoneModeSelector(PHONE_MODE.WEREWOLF_HUNT))!.closest('[draggable="true"]')!;
    fireEvent.click(hunt.querySelector('[data-line-checkbox]')!);
    expect(onLineCompletedChange).toHaveBeenCalledWith(expect.stringContaining("3:normal:"), true, expect.any(Number), ["wolf", "puppet"]);
    expect(onScriptLinesChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ requires: ["e02"], participantIds: ["witch"] }),
    ]));
  });

  it("allows dragging the Monkey script line with its real source", () => {
    const { container } = render(<NightScript {...baseProps} activeRoles={new Set(["v26"])}
      roleAssignments={{ monkey: "v26" }} players={[{ id: "monkey", name: "Monkey", seat_position: 0 }]} />);
    const line = container.querySelector('[draggable="true"]')!;
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    fireEvent.dragStart(line, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("action", "role-v26");
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "monkey");
  });

  it("records only the Actor for a separate copied action line", () => {
    const onScriptLinesChange = vi.fn();
    render(<NightScript {...baseProps} activeRoles={new Set(["v26", "a04"])}
      roleAssignments={{ monkey: "v26", actor: "v26" }} baseRoleAssignments={{ monkey: "v26", actor: "a04" }}
      actorPlayerId="actor" actorCopiedRole="v26" actorCopyNoticeNight={1}
      players={[{ id: "monkey", name: "Monkey", seat_position: 0 }, { id: "actor", name: "Actor", seat_position: 1 }]}
      onScriptLinesChange={onScriptLinesChange} />);
    expect(onScriptLinesChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ key: expect.stringContaining(":actor"), participantIds: ["actor"] }),
      expect.objectContaining({ sourcePlayerId: "monkey", participantIds: ["monkey"] }),
    ]));
  });
  it("provides the Monkey exhaustion checkbox only after the first night", () => {
    const onMonkeyDisabledToggle = vi.fn();
    const props = { ...baseProps, activeRoles: new Set(["v26" as const]), roleAssignments: { monkey: "v26" as const },
      players: [{ id: "monkey", name: "Monkey", seat_position: 0 }], monkeyDisabled: false, onMonkeyDisabledToggle };
    const { getByRole, queryByRole, rerender } = render(<NightScript {...props} nightNumber={1} />);
    expect(queryByRole("checkbox", { name: "Poder esgotado" })).toBeNull();
    expect(getByRole("button", { name: getRoleLabel("v26", "pt") })).toBeInTheDocument();
    rerender(<NightScript {...props} nightNumber={2} />);
    const checkbox = getByRole("checkbox", { name: "Poder esgotado" });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveClass("border-blue-400");
    fireEvent.click(checkbox);
    expect(onMonkeyDisabledToggle).toHaveBeenCalledOnce();
  });

  it("keeps copied Monkey exhaustion independent and restores manually enabled actions", () => {
    const onMonkeyDisabledToggle = vi.fn(), onActorPowerStateChange = vi.fn();
    const props = { ...baseProps, activeRoles: new Set(["v26" as const, "a04" as const]),
      roleAssignments: { monkey: "v26" as const, actor: "v26" as const },
      baseRoleAssignments: { monkey: "v26" as const, actor: "a04" as const },
      actorPlayerId: "actor", actorCopiedRole: "v26" as const, actorCopyNoticeNight: 1,
      players: [{ id: "monkey", name: "Monkey", seat_position: 0 }, { id: "actor", name: "Actor", seat_position: 1 }],
      monkeyDisabled: true, onMonkeyDisabledToggle, onActorPowerStateChange };
    const { getByRole, queryAllByRole, rerender } = render(<NightScript {...props}
      powerlessPlayerIds={new Set(["monkey"])} actorPowerState={EMPTY_ACTOR_POWER_STATE} />);
    expect(queryAllByRole("button", { name: getRoleLabel("v26", "pt") })).toHaveLength(1);
    fireEvent.click(getByRole("checkbox", { name: "Poder esgotado" }));
    expect(onActorPowerStateChange).toHaveBeenCalledWith(expect.objectContaining({ monkeyDisabled: true }));
    expect(onMonkeyDisabledToggle).not.toHaveBeenCalled();
    rerender(<NightScript {...props} powerlessPlayerIds={new Set(["monkey", "actor"])}
      actorPowerState={{ ...EMPTY_ACTOR_POWER_STATE, monkeyDisabled: true }} />);
    expect(queryAllByRole("button", { name: getRoleLabel("v26", "pt") })).toHaveLength(0);
    rerender(<NightScript {...props} monkeyDisabled={false} powerlessPlayerIds={new Set()}
      actorPowerState={EMPTY_ACTOR_POWER_STATE} />);
    expect(queryAllByRole("button", { name: getRoleLabel("v26", "pt") })).toHaveLength(2);
  });

  it("opens the Monkey's private selection using an eye, including Actor copies", () => {
    const onPhoneToggle = vi.fn();
    const { container, getAllByRole } = render(<NightScript {...baseProps}
      activeRoles={new Set(["v26", "a04"])}
      roleAssignments={{ monkey: "v26", actor: "v26" }} baseRoleAssignments={{ monkey: "v26", actor: "a04" }}
      abilityRoleAssignments={{ monkey: "v26", actor: "v26" }} actorPlayerId="actor" actorCopiedRole="v26" actorCopyNoticeNight={1}
      players={[{ id: "monkey", name: "Monkey", seat_position: 0 }, { id: "actor", name: "Actor", seat_position: 1 }]}
      onPhoneToggle={onPhoneToggle} />);
    const eyes = getAllByRole("button", { name: getRoleLabel("v26", "pt") });
    expect(eyes).toHaveLength(2);
    eyes.forEach((eye) => { expect(eye.querySelector(".lucide-eye")).toBeInTheDocument(); fireEvent.click(eye); });
    expect(onPhoneToggle).toHaveBeenCalledWith(PHONE_MODE.MONKEY_TAMER_REVEAL, expect.any(String), "monkey", expect.any(Number));
    expect(onPhoneToggle).toHaveBeenCalledWith(PHONE_MODE.MONKEY_TAMER_REVEAL, expect.any(String), "actor", expect.any(Number));
    expect(container.querySelector(phoneModeSelector(PHONE_MODE.MONKEY_TAMER_REVEAL))).not.toBeInTheDocument();
  });
  it("opens Witch and allies modes without marking either line completed", () => {
    const onPhoneToggle = vi.fn();
    const onLineCompletedChange = vi.fn();
    const { container } = render(<NightScript {...baseProps} onPhoneToggle={onPhoneToggle} onLineCompletedChange={onLineCompletedChange} />);
    const phoneButtons = container.querySelectorAll("button[data-phone-control]");
    phoneButtons.forEach((button) => {
      expect(button).toHaveClass("h-6", "w-6");
      expect(button.closest("[data-script-actions]")).toHaveClass("absolute", "right-10");
      fireEvent.click(button);
    });
    expect(container.querySelector(`${phoneModeSelector(PHONE_MODE.WEREWOLF_ALLIES)} .lucide-users`)).toBeInTheDocument();
    expect(container.querySelector(`${phoneModeSelector(PHONE_MODE.EVIL_WITCH_POISON)} .lucide-flask-conical`)).toBeInTheDocument();
    expect(onPhoneToggle).toHaveBeenCalledWith(PHONE_MODE.WEREWOLF_ALLIES, expect.any(String), null, null);
    expect(onPhoneToggle).toHaveBeenCalledWith(PHONE_MODE.EVIL_WITCH_POISON, expect.any(String), "witch", expect.anything());
    expect(onLineCompletedChange).not.toHaveBeenCalled();
  });

  it("gives a copied Witch line its own phone source for Actor, Dog, Drunkard, and Mime", () => {
    const onPhoneToggle = vi.fn();
    const { container } = render(<NightScript {...baseProps}
      activeRoles={new Set(["e02", "a01", "a02", "a03", "a04"])}
      roleAssignments={{ witch: "e02", actor: "e02", drunkard: "e02", dog: "a02", mime: "a03" }}
      baseRoleAssignments={{ witch: "e02", actor: "a04", drunkard: "a01", dog: "a02", mime: "a03" }}
      abilityRoleAssignments={{ witch: "e02", actor: "e02", drunkard: "e02", dog: "e02", mime: "e02" }}
      players={["witch", "actor", "drunkard", "dog", "mime"].map((id, index) => ({ id, name: id, seat_position: index }))}
      actorPlayerId="actor" actorCopiedRole="e02" actorCopyNoticeNight={1}
      dogWolfPlayerIds={["dog"]} dogWolfStates={{ dog: createDogWolfState("witch") }}
      mimePlayerId="mime" mimeMechanicalRole="e02"
      onPhoneToggle={onPhoneToggle}
    />);
    container.querySelectorAll("button[data-phone-control]").forEach((button) => fireEvent.click(button));
    for (const id of ["witch", "actor", "drunkard", "dog", "mime"]) {
      expect(onPhoneToggle).toHaveBeenCalledWith(PHONE_MODE.EVIL_WITCH_POISON, expect.any(String), id, expect.anything());
    }
  });

  it("gives the Mime a Shaman phone action even when the original Shaman has used both charges", () => {
    const onPhoneToggle = vi.fn();
    const { container } = render(<NightScript {...baseProps}
      activeRoles={new Set(["e03", "a03"])} roleAssignments={{ shaman: "e03", mime: "a03" }}
      players={[{ id: "shaman", name: "Shaman", seat_position: 0 }, { id: "mime", name: "Mime", seat_position: 1 }]}
      shamanCharges={2} mimePlayerId="mime" mimeMechanicalRole="e03"
      conditionKeys={{ hasRedXPlayers: true }} onPhoneToggle={onPhoneToggle}
    />);
    container.querySelectorAll("button[data-phone-control]").forEach((button) => fireEvent.click(button));
    expect(container.querySelector(`${phoneModeSelector(PHONE_MODE.SHAMAN_SAVE)} .lucide-shield-plus`)).toBeInTheDocument();
    expect(onPhoneToggle).toHaveBeenCalledWith(PHONE_MODE.SHAMAN_SAVE, expect.any(String), "mime", expect.anything());
    expect(onPhoneToggle).not.toHaveBeenCalledWith(PHONE_MODE.SHAMAN_SAVE, expect.any(String), "shaman", expect.anything());
  });

  it("uses the Crosshair icon for the pack hunt action", () => {
    const { container } = render(<NightScript {...baseProps}
      activeRoles={new Set(["e01"])}
      roleAssignments={{ wolf: "e01" }}
      players={[{ id: "wolf", name: "Wolf", seat_position: 0 }]}
      onPhoneToggle={vi.fn()}
    />);

    expect(container.querySelector(`${phoneModeSelector(PHONE_MODE.WEREWOLF_HUNT)} .lucide-crosshair`)).toBeInTheDocument();
  });

  it("uses a shield instead of the generic revolving arrow for the Captain", () => {
    const { container } = render(<NightScript {...baseProps}
      activeRoles={new Set(["v09"])}
      roleAssignments={{ captain: "v09" }}
      players={[{ id: "captain", name: "Captain", seat_position: 0 }]}
      onPhoneToggle={vi.fn()}
    />);

    const control = container.querySelector(phoneModeSelector(PHONE_MODE.CAPTAIN_APPOINT_SOLDIER));
    expect(control?.querySelector(".lucide-shield-plus")).toBeInTheDocument();
    expect(control?.querySelector(".lucide-rotate-ccw")).not.toBeInTheDocument();
  });
});

describe("NightScript progress", () => {
  it("does not replay a historical auto-complete event after remounting", async () => {
    const onLineCompletedChange = vi.fn();
    const { rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          autoCompleteRole="e02"
          autoCompleteVersion={4}
          onLineCompletedChange={onLineCompletedChange}
        />
      </LanguageContext.Provider>,
    );

    expect(onLineCompletedChange).not.toHaveBeenCalled();

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          autoCompleteRole="e02"
          autoCompleteVersion={5}
          onLineCompletedChange={onLineCompletedChange}
        />
      </LanguageContext.Provider>,
    );

    await waitFor(() => expect(onLineCompletedChange).toHaveBeenCalledTimes(1));
  });

  it("completes both owner and Dog lines when they perform one shared action", async () => {
    const onLineCompletedChange = vi.fn();
    const props = {
      ...baseProps,
      activeRoles: new Set(["e02" as const, "a02" as const]),
      roleAssignments: { owner: "e02" as const, dog: "a02" as const },
      baseRoleAssignments: { owner: "e02" as const, dog: "a02" as const },
      abilityRoleAssignments: { owner: "e02" as const, dog: "e02" as const },
      dogWolfPlayerIds: ["dog"],
      dogWolfStates: { dog: createDogWolfState("owner") },
      players: [
        { id: "owner", name: "Owner", seat_position: 0 },
        { id: "dog", name: "Dog", seat_position: 1 },
      ],
      autoCompleteRole: "e02" as const,
      autoCompleteSourcePlayerIds: ["owner", "dog"],
      onLineCompletedChange,
    };
    const { rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} autoCompleteVersion={1} />
      </LanguageContext.Provider>,
    );

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} autoCompleteVersion={2} />
      </LanguageContext.Provider>,
    );

    await waitFor(() => expect(onLineCompletedChange).toHaveBeenCalledTimes(2));
    expect(onLineCompletedChange.mock.calls.map(([key]) => key)).toEqual(expect.arrayContaining([
      expect.stringContaining(":normal:"),
      expect.stringContaining(":dog:dog"),
    ]));
  });
});

describe("NightScript conditional behavior", () => {
  it("shows an eye action on the Mime script line", () => {
    const onMimeReveal = vi.fn();
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["a03" as const])}
          roleAssignments={{ mime: "a03" as const }}
          players={[{ id: "mime", name: "Mime", seat_position: 0 }]}
          onMimeReveal={onMimeReveal}
        />
      </LanguageContext.Provider>,
    );

    for (const button of Array.from(container.querySelectorAll("button"))) {
      fireEvent.click(button);
    }

    expect(onMimeReveal).toHaveBeenCalledWith("mime");
  });

  it("replaces the Mime reveal line with the copied role line after a copy is active", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["a03" as const, "e02" as const, "v25" as const, "e03" as const])}
          roleAssignments={{ mime: "a03" as const, witch: "e02" as const, priest: "v25" as const, shaman: "e03" as const }}
          players={[
            { id: "mime", name: "Mime", seat_position: 0 },
            { id: "witch", name: "Witch", seat_position: 1 },
            { id: "priest", name: "Priest", seat_position: 2 },
            { id: "shaman", name: "Shaman", seat_position: 3 },
          ]}
          permanentlyDead={new Set(["witch"])}
          mimePlayerId="mime"
          mimeMechanicalRole="e02"
          conditionKeys={{ hasRedXPlayers: true }}
        />
      </LanguageContext.Provider>,
    );

    const text = container.textContent ?? "";
    const priestIndex = text.indexOf("O Padre acorda");
    const mimeCopyIndex = text.indexOf("(A Bruxa Malvada acorda");
    const shamanIndex = text.indexOf("O Chaman acorda");
    expect(text).not.toContain("O Mimo acorda");
    expect(mimeCopyIndex).toBeGreaterThan(priestIndex);
    expect(mimeCopyIndex).toBeLessThan(shamanIndex);
    expect(container.querySelector('img[alt="Mimo"]')).toBeTruthy();
  });

  it("keeps the Mime copied line available without changing the Mime's real role", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["a03" as const, "e02" as const])}
          roleAssignments={{ mime: "a03" as const, witch: "e02" as const }}
          players={[
            { id: "mime", name: "Mime", seat_position: 0 },
            { id: "witch", name: "Witch", seat_position: 1 },
          ]}
          permanentlyDead={new Set(["witch"])}
          mimePlayerId="mime"
          mimeMechanicalRole="e02"
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).not.toContain("O Mimo acorda");
    expect(container.textContent).toContain("(A Bruxa Malvada acorda");
  });

  it("creates a draggable copied Mime line for Paranoid even though Paranoid has no normal script line", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["a03" as const, "v10" as const])}
          roleAssignments={{ mime: "a03" as const, paranoid: "v10" as const }}
          players={[
            { id: "mime", name: "Mime", seat_position: 0 },
            { id: "paranoid", name: "Paranoid", seat_position: 1 },
            { id: "target", name: "Target", seat_position: 2 },
          ]}
          mimePlayerId="mime"
          mimeMechanicalRole="v10"
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).not.toContain("O Mimo acorda");
    expect(container.textContent).toContain("(O Paranoico acorda");
    expect(container.querySelector('img[alt="Mimo"]')).toBeTruthy();

    const draggableLine = Array.from(container.querySelectorAll('[draggable="true"]'))
      .find((element) => element.textContent?.includes("Paranoico")) as HTMLElement;
    expect(draggableLine).toBeTruthy();
    fireEvent.dragStart(draggableLine, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("action", "role-v10");
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "mime");
  });

  it("creates a draggable copied Mime line for Angel even though Angel has no GM script line", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["a03" as const, "v18" as const])}
          roleAssignments={{ mime: "a03" as const, angel: "v18" as const, ghost: "v02" as const }}
          players={[
            { id: "mime", name: "Mime", seat_position: 0 },
            { id: "angel", name: "Angel", seat_position: 1 },
            { id: "ghost", name: "Ghost", seat_position: 2 },
          ]}
          permanentlyDead={new Set(["ghost"])}
          mimePlayerId="mime"
          mimeMechanicalRole="v18"
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).not.toContain("O Mimo acorda");
    expect(container.textContent).toContain("(O Anjo acorda");
    expect(container.querySelector('img[alt="Mimo"]')).toBeTruthy();

    const draggableLine = Array.from(container.querySelectorAll('[draggable="true"]'))
      .find((element) => element.textContent?.includes("Anjo")) as HTMLElement;
    expect(draggableLine).toBeTruthy();
    fireEvent.dragStart(draggableLine, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("action", "role-v18");
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "mime");
  });

  it("lets a Mime copying a base Werewolf drag-kill even when the pack is blocked", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["a03" as const, "e01" as const])}
          roleAssignments={{ mime: "a03" as const, wolf: "e01" as const }}
          players={[
            { id: "mime", name: "Mime", seat_position: 0 },
            { id: "wolf", name: "Wolf", seat_position: 1 },
          ]}
          mimePlayerId="mime"
          mimeMechanicalRole="e01"
          conditionKeys={{ astronomerBlocksWerewolvesTonight: true }}
        />
      </LanguageContext.Provider>,
    );

    const draggableLine = container.querySelector('[draggable="true"]') as HTMLElement;
    expect(draggableLine).toBeTruthy();
    fireEvent.dragStart(draggableLine, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("action", "kill");
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "mime");
  });

  it("renders a distinct intoxicated Drunkard line that keeps the Drunkard as its source", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const props = {
      ...baseProps,
      activeRoles: new Set(["v16" as const]),
      roleAssignments: { drunkard: "v16" as const },
      baseRoleAssignments: { drunkard: "a01" as const },
      players: [{ id: "drunkard", name: "Drunkard", seat_position: 0 }],
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} />
      </LanguageContext.Provider>,
    );

    const line = container.querySelector('[draggable="true"]') as HTMLElement;
    expect(line).toBeTruthy();
    expect(line.querySelector('img[alt="Bêbado"]')).toBeTruthy();
    expect(line.firstElementChild?.className).toContain("bg-green-900/30");
    fireEvent.dragStart(line, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "drunkard");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} poisonedPlayerId="drunkard" />
      </LanguageContext.Provider>,
    );
    expect(container.querySelector('[draggable="true"]')?.firstElementChild?.className).not.toContain("bg-green-900/30");
  });

  it("inverts Bear Tamer information for the Drunkard and restores truth when poisoned", () => {
    const props = {
      ...baseProps,
      activeRoles: new Set(["v02" as const, "l01" as const]),
      roleAssignments: { drunkard: "v02" as const, left: "l01" as const, right: "l01" as const },
      baseRoleAssignments: { drunkard: "a01" as const, left: "l01" as const, right: "l01" as const },
      players: [
        { id: "drunkard", name: "Drunkard", seat_position: 0 },
        { id: "left", name: "Left", seat_position: 1 },
        { id: "right", name: "Right", seat_position: 2 },
      ],
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("O Urso rosna.");
    expect(container.textContent).not.toContain("O Urso não rosna.");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} poisonedPlayerId="drunkard" />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("O Urso não rosna.");
  });

  it("confuses the Raven for any living Illusion and the Bunnies when their tamer is the Illusion", () => {
    const common = {
      ...baseProps,
      players: [
        { id: "tamer", name: "Tamer", seat_position: 0 },
        { id: "villager", name: "Villager", seat_position: 1 },
        { id: "other", name: "Other", seat_position: 2 },
      ],
      illusionPlayerIds: new Set(["villager"]),
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="en">
        <NightScript {...common} activeRoles={new Set(["v03", "v01"])}
          roleAssignments={{ tamer: "v03", villager: "v01", other: "v01" }} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("The Raven is confused.");

    rerender(
      <LanguageContext.Provider value="en">
        <NightScript {...common} activeRoles={new Set(["v05", "v01"])}
          roleAssignments={{ tamer: "v05", villager: "v01", other: "v01" }}
          illusionPlayerIds={new Set(["tamer"])} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("The Bunnies were confused tonight.");
  });

  it("shows the v12 line only while a poisoned character exists", () => {
    const props = {
      ...baseProps,
      activeRoles: new Set(["v12" as const]),
      roleAssignments: { gypsy: "v12" as const },
      players: [{ id: "gypsy", name: "Gypsy", seat_position: 0 }],
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} conditionKeys={{ poisonedCharacterPresent: false }} />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).not.toContain("indica 3 vizinhos");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} conditionKeys={{ poisonedCharacterPresent: true }} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("indica 3 vizinhos");
  });

  it("writes the Boy's YES, NO, and ILLUSION answers into the script line and reverses ordinary answers when poisoned", () => {
    const props = {
      ...baseProps,
      activeRoles: new Set(["v22" as const, "e01" as const, "v01" as const]),
      roleAssignments: { boy: "v22" as const, wolf: "e01" as const, villager: "v01" as const, illusion: "v01" as const },
      abilityRoleAssignments: { boy: "v22" as const, wolf: "e01" as const, villager: "v01" as const, illusion: "v01" as const },
      objectiveRoleAssignments: { boy: "v22" as const, wolf: "e01" as const, villager: "v01" as const, illusion: "v01" as const },
      players: [
        { id: "boy", name: "Boy", seat_position: 0 },
        { id: "wolf", name: "Wolf", seat_position: 1 },
        { id: "villager", name: "Villager", seat_position: 2 },
        { id: "illusion", name: "Hidden", seat_position: 3 },
      ],
      playerEffects: {
        wolf: new Set(["accused"]), villager: new Set(["accused"]), illusion: new Set(["accused"]),
      },
      illusionPlayerIds: new Set(["illusion"]),
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="en"><NightScript {...props} /></LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("Wolf: YES, Villager: NO, Hidden: ILLUSION");

    rerender(<LanguageContext.Provider value="en"><NightScript {...props}
      poisonedPlayerId="boy" poisonedPlayerIds={new Set(["boy"])} /></LanguageContext.Provider>);
    expect(container.textContent).toContain("Wolf: NO, Villager: YES, Hidden: ILLUSION");
  });

  it("makes only Cupid's first-night line draggable", () => {
    const cupidProps = {
      ...baseProps,
      activeRoles: new Set(["s01" as const]),
      roleAssignments: { cupid: "s01" as const },
      players: [{ id: "cupid", name: "Cupid", seat_position: 0 }],
      conditionKeys: { cupidHasCharges: true },
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...cupidProps} nightNumber={1} />
      </LanguageContext.Provider>,
    );

    const draggableText = () => Array.from(container.querySelectorAll('[draggable="true"]'))
      .map((element) => element.textContent || "");
    expect(draggableText().some((text) => text.includes("escolhe dois jogadores"))).toBe(true);

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...cupidProps} nightNumber={2} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("decide com o polegar");
    expect(draggableText().some((text) => text.includes("decide com o polegar"))).toBe(false);
  });

  it("changes the White Werewolf instruction when no other werewolf remains", () => {
    const whiteWolfProps = {
      ...baseProps,
      activeRoles: new Set(["s02" as const]),
      roleAssignments: { white: "s02" as const },
      players: [{ id: "white", name: "White Wolf", seat_position: 0 }],
      nightNumber: 3,
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...whiteWolfProps} conditionKeys={{ whitewolfNight: true, whitewolfSolo: true }} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("escolhe mais um jogador");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...whiteWolfProps} conditionKeys={{ whitewolfNight: true, whitewolfSolo: false }} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("escolhe o Lobisomem que quer matar");
  });
});

describe("NightScript Actor copy", () => {
  it("lets Actor inherit the hidden Drunkard replacement and poison inversion", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const props = {
      ...baseProps,
      activeRoles: new Set(["v16" as const]),
      roleAssignments: { actor: "v16" as const, drunkard: "v16" as const },
      baseRoleAssignments: { actor: "a04" as const, drunkard: "a01" as const },
      permanentlyDead: new Set(["drunkard"]),
      players: [
        { id: "actor", name: "Actor", seat_position: 0 },
        { id: "drunkard", name: "Drunkard", seat_position: 1 },
      ],
      actorPlayerId: "actor",
      actorCopiedRole: "a01" as const,
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} />
      </LanguageContext.Provider>,
    );

    const line = container.querySelector('[draggable="true"]') as HTMLElement;
    expect(line.textContent).toContain("Ator");
    expect(line.textContent).not.toContain("Sonâmbulo");
    expect(line.querySelector('img[alt="Bêbado"]')).toBeTruthy();
    expect(line.firstElementChild?.className).toContain("bg-green-900/30");
    fireEvent.dragStart(line, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "actor");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} poisonedPlayerId="actor" />
      </LanguageContext.Provider>,
    );
    expect(container.querySelector('[draggable="true"]')?.firstElementChild?.className).not.toContain("bg-green-900/30");
  });

  it("uses Actor's fresh Fox state when the copied Drunkard was the Fox Tamer", () => {
    const onActorPowerStateChange = vi.fn();
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["v04"])}
          roleAssignments={{ actor: "v04", drunkard: "v04" }}
          baseRoleAssignments={{ actor: "a04", drunkard: "a01" }}
          permanentlyDead={new Set(["drunkard"])}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "drunkard", name: "Drunkard", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="a01"
          actorPowerState={{ ...EMPTY_ACTOR_POWER_STATE, foxDisabled: false }}
          onActorPowerStateChange={onActorPowerStateChange}
          foxDisabled
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Ator");
    expect(container.textContent).not.toContain("Domador da Raposa");
    const foxCheckbox = Array.from(container.querySelectorAll('button[role="checkbox"]'))
      .find((checkbox) => !checkbox.hasAttribute("data-line-checkbox"));
    fireEvent.click(foxCheckbox!);
    expect(onActorPowerStateChange).toHaveBeenCalledWith(expect.objectContaining({ foxDisabled: true }));
  });

  it("shows Actor in place of a copied role and keeps a separate line when that role is also in play", () => {
    const actorProps = {
      ...baseProps,
      activeRoles: new Set(["e02" as const]),
      roleAssignments: { actor: "e02" as const, witch: "e02" as const },
      baseRoleAssignments: { actor: "a04" as const, witch: "e02" as const },
      players: [
        { id: "actor", name: "Actor", seat_position: 0 },
        { id: "witch", name: "Witch", seat_position: 1 },
      ],
      actorPlayerId: "actor",
      actorCopiedRole: "e02" as const,
    };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...actorProps} />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Bruxa Malvada");
    expect(container.textContent).toContain("Ator");
  });

  it("adds Actor to the shared werewolf wake-up line", () => {
    const actorProps = {
      ...baseProps,
      activeRoles: new Set(["e01" as const, "m01" as const]),
      roleAssignments: { wolf: "e01" as const, actor: "m01" as const },
      baseRoleAssignments: { wolf: "e01" as const, actor: "a04" as const },
      players: [
        { id: "wolf", name: "Wolf", seat_position: 0 },
        { id: "actor", name: "Actor", seat_position: 1 },
      ],
      actorPlayerId: "actor",
      actorCopiedRole: "m01" as const,
      conditionKeys: { bigBadWolfHasCharges: true },
    };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...actorProps} />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Lobisomens (+ Ator)");
  });

  it("does not keep a second script line for the dead Idol", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["e02"])}
          roleAssignments={{ actor: "e02", idol: "e02" }}
          baseRoleAssignments={{ actor: "a04", idol: "e02" }}
          permanentlyDead={new Set(["idol"])}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "idol", name: "Idol", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="e02"
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Ator");
    expect(container.textContent).not.toContain("Bruxa Malvada");
  });

  it("keeps the prophetic Idol as the owner of their final role action", () => {
    const idolTransfer = { setData: vi.fn(), effectAllowed: "" };
    const actorTransfer = { setData: vi.fn(), effectAllowed: "" };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          nightNumber={4}
          activeRoles={new Set(["e02"])}
          roleAssignments={{ actor: "e02", idol: "e02" }}
          baseRoleAssignments={{ actor: "a04", idol: "e02" }}
          permanentlyDead={new Set(["idol"])}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "idol", name: "Idol", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="e02"
          prophecyGhostPlayerIds={new Set(["idol"])}
        />
      </LanguageContext.Provider>,
    );

    const lines = Array.from(container.querySelectorAll('[draggable="true"]'));
    const idolLine = lines.find((line) => line.textContent?.includes("Bruxa Malvada"));
    const actorLine = lines.find((line) => line.textContent?.includes("Ator"));
    fireEvent.dragStart(idolLine!, { dataTransfer: idolTransfer });
    fireEvent.dragStart(actorLine!, { dataTransfer: actorTransfer });

    expect(idolTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "idol");
    expect(actorTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "actor");
  });

  it("keeps the dead Hunter as owner of the pending ghost kill and separately calls Actor for the card change", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["v08"])}
          roleAssignments={{ actor: "v08", hunter: "v08" }}
          baseRoleAssignments={{ actor: "a04", hunter: "v08" }}
          permanentlyDead={new Set(["hunter"])}
          lastNightDeadPlayerIds={["hunter"]}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "hunter", name: "Hunter", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="v08"
          actorCopyNoticeNight={2}
          conditionKeys={{ hunterDied: true }}
          deathTriggeredSourcePlayerIds={{ hunterDied: ["hunter"] }}
        />
      </LanguageContext.Provider>,
    );

    const ghostLine = Array.from(container.querySelectorAll('[draggable="true"]'))
      .find((element) => element.textContent?.includes("Fantasma"));
    expect(ghostLine?.textContent).toContain("Caçador");
    expect(container.textContent).toContain("papel ao qual irá responder");
    fireEvent.dragStart(ghostLine!, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "hunter");
  });

  it("keeps Actor's copied Hunter ghost action after Actor dies", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["v08"])}
          roleAssignments={{ actor: "v08", hunter: "v08" }}
          baseRoleAssignments={{ actor: "a04", hunter: "v08" }}
          permanentlyDead={new Set(["actor", "hunter"])}
          lastNightDeadPlayerIds={["actor"]}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "hunter", name: "Hunter", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="v08"
          conditionKeys={{ hunterDied: true }}
          deathTriggeredSourcePlayerIds={{ hunterDied: ["actor"] }}
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Fantasma do Ator");
  });

  it("calls a dead Actor as the copied role on the prophecy night", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          nightNumber={4}
          roleAssignments={{ actor: "e02", idol: "v03" }}
          baseRoleAssignments={{ actor: "a04", idol: "v03" }}
          permanentlyDead={new Set(["actor", "idol"])}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "idol", name: "Idol", seat_position: 1 },
          ]}
          actorPlayerId="actor"
          actorCopiedRole="e02"
          prophecyGhostPlayerIds={new Set(["actor"])}
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Ator");
    expect(container.textContent).not.toContain("Bruxa Malvada");
  });

  it("tracks the dead Soldier as owner of the analogous ghost kill", () => {
    const dataTransfer = { setData: vi.fn(), effectAllowed: "" };
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          conditionKeys={{ soldierDied: true }}
          deathTriggeredSourcePlayerIds={{ soldierDied: ["soldier"] }}
        />
      </LanguageContext.Provider>,
    );
    const ghostLine = Array.from(container.querySelectorAll('[draggable="true"]'))
      .find((element) => element.textContent?.includes("SOLDADO"));
    fireEvent.dragStart(ghostLine!, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith("sourcePlayerId", "soldier");
  });
});

describe("NightScript Dog-Wolf copy", () => {
  it("adds a parenthesized Dog line beneath the owner's line with an independent drag source", () => {
    const transfers = [
      { setData: vi.fn(), effectAllowed: "" },
      { setData: vi.fn(), effectAllowed: "" },
    ];
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["e02", "a02"])}
          roleAssignments={{ owner: "e02", dog: "a02" }}
          baseRoleAssignments={{ owner: "e02", dog: "a02" }}
          abilityRoleAssignments={{ owner: "e02", dog: "e02" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: createDogWolfState("owner") }}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    const draggableLines = Array.from(container.querySelectorAll('[draggable="true"]')) as HTMLElement[];
    expect(draggableLines).toHaveLength(2);
    expect(draggableLines[1].textContent).toContain("(O Cão");
    expect(draggableLines[1].querySelector('img[alt="Cão-Lobo"]')).toBeNull();
    draggableLines.forEach((line, index) => fireEvent.dragStart(line, { dataTransfer: transfers[index] }));
    expect(transfers[0].setData).toHaveBeenCalledWith("sourcePlayerId", "owner");
    expect(transfers[1].setData).toHaveBeenCalledWith("sourcePlayerId", "dog");
  });

  it("keeps owner and Dog poison states independent", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["e02", "a02"])}
          roleAssignments={{ owner: "e02", dog: "a02" }}
          abilityRoleAssignments={{ owner: "e02", dog: "e02" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: createDogWolfState("owner") }}
          poisonedPlayerIds={new Set(["dog"])}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    const draggableLines = Array.from(container.querySelectorAll('[draggable="true"]')) as HTMLElement[];
    expect(draggableLines[0].firstElementChild?.className).not.toContain("bg-green-900/30");
    expect(draggableLines[1].firstElementChild?.className).toContain("bg-green-900/30");
  });

  it("shows the Dog-Wolf choice line when the copied Dog-Wolf had no owner", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["a02"])}
          roleAssignments={{ actor: "a02", dog: "a02" }}
          baseRoleAssignments={{ actor: "a04", dog: "a02" }}
          dogWolfPlayerIds={["dog", "actor"]}
          dogWolfStates={{ dog: createDogWolfState(), actor: createDogWolfState() }}
          permanentlyDead={new Set(["dog"])}
          actorPlayerId="actor"
          actorCopiedRole="a02"
          nightNumber={4}
          players={[
            { id: "actor", name: "Actor", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
            { id: "owner", name: "Owner", seat_position: 2 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Cão-Lobo acorda");
  });

  it("shows each Spider eye only for players caught in that source's own web", () => {
    const onSpiderReveal = vi.fn();
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["v23", "a02"])}
          roleAssignments={{ owner: "v23", dog: "a02" }}
          abilityRoleAssignments={{ owner: "v23", dog: "v23" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: createDogWolfState("owner") }}
          conditionKeys={{ spiderHasCaught: true }}
          spiderCaughtBySource={{ dog: ["visitor"] }}
          onSpiderReveal={onSpiderReveal}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
            { id: "visitor", name: "Visitor", seat_position: 2 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    const eyeButtons = Array.from(container.querySelectorAll("button"))
      .filter((button) => button.querySelector("svg.lucide-eye"));
    expect(eyeButtons).toHaveLength(1);
    fireEvent.click(eyeButtons[0]);
    expect(onSpiderReveal).toHaveBeenCalledWith("dog");
  });

  it("does not let Dog-as-Cupid create a second pair of Lovers", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          nightNumber={1}
          activeRoles={new Set(["s01", "a02"])}
          roleAssignments={{ owner: "s01", dog: "a02" }}
          baseRoleAssignments={{ owner: "s01", dog: "a02" }}
          abilityRoleAssignments={{ owner: "s01", dog: "s01" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: createDogWolfState("owner") }}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    expect(container.querySelectorAll('[draggable="true"]')).toHaveLength(1);
    expect(container.textContent).toContain("C\u00e3o");
  });

  it("keeps Dog-as-Evil-Cupid standalone until two living enemies are selected", () => {
    const state = createDogWolfState("owner");
    state.enemyPlayerIds = ["enemy-one"];
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["m05", "a02"])}
          roleAssignments={{ owner: "m05", dog: "a02", "enemy-one": "v02" }}
          baseRoleAssignments={{ owner: "m05", dog: "a02", "enemy-one": "v02" }}
          abilityRoleAssignments={{ owner: "m05", dog: "m05", "enemy-one": "v02" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: state }}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
            { id: "enemy-one", name: "Enemy", seat_position: 2 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    const dogLine = Array.from(container.querySelectorAll('[draggable="true"]'))
      .find((line) => line.textContent?.includes("C\u00e3o"));
    expect(dogLine).toBeTruthy();
    expect(dogLine?.textContent?.trim().startsWith("(")).toBe(false);
  });

  it("replaces every repeated owner-role name in a Dog line", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          nightNumber={1}
          activeRoles={new Set(["v23", "a02"])}
          roleAssignments={{ owner: "v23", dog: "a02" }}
          baseRoleAssignments={{ owner: "v23", dog: "a02" }}
          abilityRoleAssignments={{ owner: "v23", dog: "v23" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: createDogWolfState("owner") }}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    const dogLine = Array.from(container.querySelectorAll('[draggable="true"]'))
      .find((line) => line.textContent?.trim().startsWith("(O C\u00e3o"));
    expect(dogLine?.textContent?.match(/C\u00e3o/g)).toHaveLength(2);
    expect(dogLine?.textContent).not.toContain("Domador da Aranha");
  });

  it("gives Dog-as-Actor a discreet Narrator prompt before its first Idol", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["a04", "a02"])}
          roleAssignments={{ owner: "a04", dog: "a02" }}
          baseRoleAssignments={{ owner: "a04", dog: "a02" }}
          abilityRoleAssignments={{ owner: "a04", dog: "a04" }}
          dogWolfPlayerIds={["dog"]}
          dogWolfStates={{ dog: createDogWolfState("owner") }}
          players={[
            { id: "owner", name: "Owner", seat_position: 0 },
            { id: "dog", name: "Dog", seat_position: 1 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).toContain("Narrador");
    expect(container.textContent).toContain("precisa de escolher um \u00cddolo");
  });

  it("waits until the night after owner selection before prompting Dog-as-Actor", () => {
    const state = createDogWolfState("owner");
    state.ownerSelectedNight = 2;
    const props = {
      ...baseProps,
      activeRoles: new Set(["a04" as const, "a02" as const]),
      roleAssignments: { owner: "a04" as const, dog: "a02" as const },
      baseRoleAssignments: { owner: "a04" as const, dog: "a02" as const },
      abilityRoleAssignments: { owner: "a04" as const, dog: "a04" as const },
      dogWolfPlayerIds: ["dog"],
      dogWolfStates: { dog: state },
      players: [
        { id: "owner", name: "Owner", seat_position: 0 },
        { id: "dog", name: "Dog", seat_position: 1 },
      ],
    };
    const { container, rerender } = render(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} nightNumber={2} />
      </LanguageContext.Provider>,
    );

    expect(container.textContent).not.toContain("precisa de escolher um \u00cddolo");

    rerender(
      <LanguageContext.Provider value="pt">
        <NightScript {...props} nightNumber={3} />
      </LanguageContext.Provider>,
    );
    expect(container.textContent).toContain("precisa de escolher um \u00cddolo");
  });

  it("does not expose a draggable werewolf line when the pack is poisoned", () => {
    const { container } = render(
      <LanguageContext.Provider value="pt">
        <NightScript
          {...baseProps}
          activeRoles={new Set(["e01", "m01"])}
          roleAssignments={{ wolf: "e01", badWolf: "m01" }}
          abilityRoleAssignments={{ wolf: "e01", badWolf: "m01" }}
          poisonedPlayerIds={new Set(["badWolf"])}
          players={[
            { id: "wolf", name: "Wolf", seat_position: 0 },
            { id: "badWolf", name: "Bad Wolf", seat_position: 1 },
          ]}
        />
      </LanguageContext.Provider>,
    );

    const draggableWerewolfLine = Array.from(container.querySelectorAll('[draggable="true"]'))
      .find((line) => line.textContent?.includes("escolhem em conjunto"));
    expect(draggableWerewolfLine).toBeUndefined();
  });
});
