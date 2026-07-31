/* @ds-bundle: {"format":4,"namespace":"Ds3DandCanvasDesignSystem_39c2f2","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"Toolbar","sourcePath":"components/actions/Toolbar.jsx"},{"name":"ToolbarDivider","sourcePath":"components/actions/Toolbar.jsx"},{"name":"ChatMessage","sourcePath":"components/ai/ChatMessage.jsx"},{"name":"PromptComposer","sourcePath":"components/ai/PromptComposer.jsx"},{"name":"VariationsGrid","sourcePath":"components/ai/VariationsGrid.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"CanvasLoader","sourcePath":"components/feedback/CanvasLoader.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"ProgressRing","sourcePath":"components/feedback/ProgressRing.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"ColorField","sourcePath":"components/inputs/ColorField.jsx"},{"name":"NumberField","sourcePath":"components/inputs/NumberField.jsx"},{"name":"SegmentedControl","sourcePath":"components/inputs/SegmentedControl.jsx"},{"name":"Slider","sourcePath":"components/inputs/Slider.jsx"},{"name":"Switch","sourcePath":"components/inputs/Switch.jsx"},{"name":"TextField","sourcePath":"components/inputs/TextField.jsx"},{"name":"SearchField","sourcePath":"components/inputs/TextField.jsx"},{"name":"Accordion","sourcePath":"components/navigation/Accordion.jsx"},{"name":"AccordionItem","sourcePath":"components/navigation/Accordion.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"SidebarLabel","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"SidebarItem","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"DropdownMenu","sourcePath":"components/overlays/DropdownMenu.jsx"},{"name":"MenuItem","sourcePath":"components/overlays/DropdownMenu.jsx"},{"name":"MenuLabel","sourcePath":"components/overlays/DropdownMenu.jsx"},{"name":"MenuSeparator","sourcePath":"components/overlays/DropdownMenu.jsx"},{"name":"Popover","sourcePath":"components/overlays/Popover.jsx"},{"name":"Tooltip","sourcePath":"components/overlays/Tooltip.jsx"},{"name":"AssetCard","sourcePath":"components/panels/AssetCard.jsx"},{"name":"FloatingPanel","sourcePath":"components/panels/FloatingPanel.jsx"},{"name":"PanelSection","sourcePath":"components/panels/FloatingPanel.jsx"},{"name":"LayerRow","sourcePath":"components/panels/LayerRow.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"e4d218456cd7","components/actions/IconButton.jsx":"3224a1dae5d9","components/actions/Toolbar.jsx":"bd5342bbe8ad","components/ai/ChatMessage.jsx":"d935183d33af","components/ai/PromptComposer.jsx":"bfb9386a9d95","components/ai/VariationsGrid.jsx":"e6054a5edd82","components/core/Icon.jsx":"90a10e8ce5ee","components/core/motion.jsx":"bc09e2fd692f","components/feedback/CanvasLoader.jsx":"1c1a1b39c8f5","components/feedback/ProgressBar.jsx":"e6bf4bd6063f","components/feedback/ProgressRing.jsx":"53bdde98d9d6","components/feedback/Skeleton.jsx":"837e803dc1a2","components/feedback/Spinner.jsx":"43bab7614bfe","components/inputs/ColorField.jsx":"3ecfb95e20b3","components/inputs/NumberField.jsx":"2beca8d10488","components/inputs/SegmentedControl.jsx":"03cd850d5aaf","components/inputs/Slider.jsx":"adac3b2c7025","components/inputs/Switch.jsx":"d29cc5704aed","components/inputs/TextField.jsx":"9aeb80f4a23a","components/navigation/Accordion.jsx":"3cd931df4cd7","components/navigation/Sidebar.jsx":"0f39c880dac8","components/navigation/Tabs.jsx":"79e7fe481651","components/overlays/DropdownMenu.jsx":"94cc4494b266","components/overlays/Popover.jsx":"2a35ee88a6af","components/overlays/Tooltip.jsx":"e5d8bed54016","components/panels/AssetCard.jsx":"033d16eece50","components/panels/FloatingPanel.jsx":"10c1cbc20a0b","components/panels/LayerRow.jsx":"d1204c65cf22","ui_kits/studio/AnimationScreen.jsx":"b0167f103aa3","ui_kits/studio/AppShell.jsx":"08d8e06f7606","ui_kits/studio/EditorScreen.jsx":"d44fd8b8e643","ui_kits/studio/ExploreScreen.jsx":"f088d9c8a124","ui_kits/studio/LibraryScreen.jsx":"a5ce3e5c7479"},"inlinedExternals":[],"unexposedExports":[{"name":"mergeHandlers","sourcePath":"components/core/motion.jsx"},{"name":"useMagnetic","sourcePath":"components/core/motion.jsx"},{"name":"useRipple","sourcePath":"components/core/motion.jsx"},{"name":"useTilt","sourcePath":"components/core/motion.jsx"}]} */

(() => {

const __ds_ns = (window.Ds3DandCanvasDesignSystem_39c2f2 = window.Ds3DandCanvasDesignSystem_39c2f2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Toolbar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.dc-tb{display:inline-flex;align-items:center;gap:var(--space-1);background:var(--surface-float);border-radius:var(--radius-2xl);padding:var(--space-2);box-shadow:var(--shadow-float);transition:box-shadow var(--dur-base) var(--ease-out)}
.dc-tb:hover{box-shadow:var(--shadow-pop)}
.dc-tb--flat:hover{box-shadow:none}
.dc-tb--vertical{flex-direction:column}
.dc-tb--flat{box-shadow:none;background:var(--surface-sunken)}
.dc-tb__divider{background:var(--border-default);flex:0 0 auto}
.dc-tb--horizontal>.dc-tb__divider{width:1px;height:20px;margin:0 var(--space-3)}
.dc-tb--vertical>.dc-tb__divider{height:1px;width:20px;margin:var(--space-3) 0}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-toolbar-css")) {
  const el = document.createElement("style");
  el.id = "dc-toolbar-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Floating tool cluster — the "toolbox". Horizontal over the canvas, vertical as a rail. */
function Toolbar({
  children,
  orientation = "horizontal",
  flat = false,
  className = "",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "toolbar",
    "aria-orientation": orientation,
    className: `dc-tb dc-tb--${orientation}${flat ? " dc-tb--flat" : ""} ${className}`,
    style: style
  }, rest), children);
}

/** Hairline rule between tool groups inside a Toolbar. */
function ToolbarDivider() {
  return /*#__PURE__*/React.createElement("span", {
    className: "dc-tb__divider",
    "aria-hidden": "true"
  });
}
Object.assign(__ds_scope, { Toolbar, ToolbarDivider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Toolbar.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Hugeicons Stroke Rounded glyph. `name` is the icon slug without the `hgi-` prefix. */
function Icon({
  name,
  size = "md",
  color,
  spin,
  style,
  className = "",
  ...rest
}) {
  const px = {
    sm: 14,
    md: 18,
    lg: 20,
    xl: 24
  }[size] || size;
  return /*#__PURE__*/React.createElement("i", _extends({
    "aria-hidden": "true",
    className: `hgi-stroke hgi-${name} ${className}`,
    style: {
      fontSize: typeof px === "number" ? `${px}px` : px,
      lineHeight: 1,
      color: color || "inherit",
      display: "inline-flex",
      flex: "0 0 auto",
      animation: spin ? "dc-spin var(--dur-spin) linear infinite" : undefined,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/motion.jsx
try { (() => {
/** Chain optional handlers (component's own + consumer's). */
function mergeHandlers(...fns) {
  return e => {
    for (const f of fns) if (typeof f === "function") f(e);
  };
}

/** Pointer-origin ripple. Spread `onPointerDown` on the host, render `node` last inside it. */
function useRipple({
  disabled = false,
  duration = 560
} = {}) {
  const [ripples, setRipples] = React.useState([]);
  const idRef = React.useRef(0);
  const onPointerDown = e => {
    if (disabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    const id = ++idRef.current;
    const d = Math.max(r.width, r.height) * 2.1;
    setRipples(rs => rs.concat({
      id,
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      d
    }));
    window.setTimeout(() => setRipples(rs => rs.filter(v => v.id !== id)), duration);
  };
  const node = ripples.length ? /*#__PURE__*/React.createElement("span", {
    className: "dc-mi-ripples",
    "aria-hidden": "true"
  }, ripples.map(v => /*#__PURE__*/React.createElement("span", {
    key: v.id,
    className: "dc-mi-ripple",
    style: {
      left: v.x,
      top: v.y,
      width: v.d,
      height: v.d
    }
  }))) : null;
  return {
    onPointerDown,
    node
  };
}

/** Cursor-following offset, written to --mi-mx / --mi-my so it composes with press scale. */
function useMagnetic({
  disabled = false,
  strength = 4
} = {}) {
  const ref = React.useRef(null);
  const onPointerMove = e => {
    const el = ref.current;
    if (!el || disabled) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    el.style.setProperty("--mi-mx", (dx * strength).toFixed(2) + "px");
    el.style.setProperty("--mi-my", (dy * strength * 0.6).toFixed(2) + "px");
  };
  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.removeProperty("--mi-mx");
    el.style.removeProperty("--mi-my");
  };
  return {
    ref,
    onPointerMove,
    onPointerLeave
  };
}

/** Pointer tilt for media tiles — writes --mi-rx / --mi-ry and flags data-tilting for a snappier transition. */
function useTilt({
  disabled = false,
  max = 4
} = {}) {
  const ref = React.useRef(null);
  const onPointerMove = e => {
    const el = ref.current;
    if (!el || disabled) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    el.dataset.tilting = "true";
    el.style.setProperty("--mi-ry", (dx * max).toFixed(2) + "deg");
    el.style.setProperty("--mi-rx", (-dy * max).toFixed(2) + "deg");
  };
  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    delete el.dataset.tilting;
    el.style.removeProperty("--mi-rx");
    el.style.removeProperty("--mi-ry");
  };
  return {
    ref,
    onPointerMove,
    onPointerLeave
  };
}
Object.assign(__ds_scope, { mergeHandlers, useRipple, useMagnetic, useTilt });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/motion.jsx", error: String((e && e.message) || e) }); }

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.dc-btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--space-3);font-family:var(--font-sans);font-weight:var(--weight-medium);letter-spacing:var(--tracking-snug);border-radius:var(--radius-md);white-space:nowrap;position:relative;overflow:hidden;transform:translate(var(--mi-mx,0px),var(--mi-my,0px));transition:var(--transition-tint),transform var(--dur-slow) var(--ease-spring-out);-webkit-user-select:none;user-select:none}
.dc-btn:active:not(:disabled){transform:translate(var(--mi-mx,0px),var(--mi-my,0px)) scale(var(--press-scale));transition-duration:var(--dur-instant)}
.dc-btn--magnetic{transition:var(--transition-tint),transform var(--dur-fast) var(--ease-out)}
.dc-btn:disabled{cursor:not-allowed;color:var(--text-disabled)}
.dc-btn--sm{height:var(--control-h-sm);padding:0 var(--space-5);font-size:var(--text-base)}
.dc-btn--md{height:var(--control-h-md);padding:0 var(--space-7);font-size:var(--text-md)}
.dc-btn--lg{height:var(--control-h-lg);padding:0 var(--space-9);font-size:var(--text-md)}
.dc-btn--pill{border-radius:var(--radius-full)}
.dc-btn--solid{background:var(--control-solid);color:var(--text-inverse)}
.dc-btn--solid:hover:not(:disabled){background:var(--control-solid-hover)}
.dc-btn--solid:disabled{background:var(--gray-200);color:var(--text-disabled)}
.dc-btn--neutral{background:var(--control-neutral);color:var(--text-primary)}
.dc-btn--neutral:hover:not(:disabled){background:var(--control-neutral-hover)}
.dc-btn--neutral:disabled{background:var(--gray-100)}
.dc-btn--quiet{background:transparent;color:var(--text-primary)}
.dc-btn--quiet:hover:not(:disabled){background:var(--surface-hover)}
.dc-btn--outline{background:var(--surface-float);color:var(--text-primary);box-shadow:inset 0 0 0 1px var(--border-default)}
.dc-btn--outline:hover:not(:disabled){background:var(--surface-hover)}
.dc-btn--accent{background:var(--blue-500);color:var(--text-inverse)}
.dc-btn--accent:hover:not(:disabled){background:var(--blue-600)}
.dc-btn--danger{background:var(--red-50);color:var(--red-600)}
.dc-btn--danger:hover:not(:disabled){background:#fddcd6}
.dc-btn--float{background:var(--surface-float);color:var(--text-primary);box-shadow:var(--shadow-float)}
.dc-btn--float:hover:not(:disabled){background:var(--gray-50)}
.dc-btn__sheen{position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none}
.dc-btn__sheen::after{content:"";position:absolute;top:-40%;bottom:-40%;left:0;width:34%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.3),transparent);transform:translateX(-180%) skewX(-16deg)}
.dc-btn:hover:not(:disabled) .dc-btn__sheen::after{animation:dc-mi-sheen var(--dur-sheen) var(--ease-out)}
.dc-btn__ico{transition:transform var(--dur-base) var(--ease-spring-out)}
.dc-btn:hover:not(:disabled) .dc-btn__ico--end{transform:translateX(2px)}
.dc-btn:hover:not(:disabled) .dc-btn__ico--start{transform:translateX(-1px) rotate(-5deg)}
.dc-btn__label{position:relative;z-index:1;display:inline-flex;align-items:center;transition:opacity var(--dur-fast) var(--ease-out)}
.dc-btn--loading .dc-btn__label{opacity:0}
.dc-btn__spin{position:absolute;inset:0;display:grid;place-items:center}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-button-css")) {
  const el = document.createElement("style");
  el.id = "dc-button-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Text button. `neutral` is the workhorse (Export/Share), `solid` the committing action. */
function Button({
  children,
  variant = "neutral",
  size = "md",
  icon,
  iconEnd,
  pill = false,
  loading = false,
  disabled = false,
  ripple = true,
  magnetic = false,
  onPointerDown,
  onPointerMove,
  onPointerLeave,
  className = "",
  style,
  ...rest
}) {
  const off = disabled || loading;
  const rip = __ds_scope.useRipple({
    disabled: off || !ripple
  });
  const mag = __ds_scope.useMagnetic({
    disabled: off || !magnetic,
    strength: 4
  });
  const sheen = !off && (variant === "solid" || variant === "accent");
  const iconSize = size === "sm" ? "sm" : "md";
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    ref: magnetic ? mag.ref : undefined,
    disabled: off,
    className: `dc-btn dc-btn--${size} dc-btn--${variant}${pill ? " dc-btn--pill" : ""}${loading ? " dc-btn--loading" : ""}${magnetic ? " dc-btn--magnetic" : ""} ${className}`,
    style: style,
    onPointerDown: __ds_scope.mergeHandlers(rip.onPointerDown, onPointerDown),
    onPointerMove: magnetic ? __ds_scope.mergeHandlers(mag.onPointerMove, onPointerMove) : onPointerMove,
    onPointerLeave: magnetic ? __ds_scope.mergeHandlers(mag.onPointerLeave, onPointerLeave) : onPointerLeave
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "dc-btn__label"
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: iconSize,
    className: "dc-btn__ico dc-btn__ico--start",
    style: {
      marginRight: children ? 6 : 0
    }
  }) : null, children, iconEnd ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconEnd,
    size: iconSize,
    className: "dc-btn__ico dc-btn__ico--end",
    style: {
      marginLeft: children ? 6 : 0
    }
  }) : null), sheen ? /*#__PURE__*/React.createElement("span", {
    className: "dc-btn__sheen",
    "aria-hidden": "true"
  }) : null, rip.node, loading ? /*#__PURE__*/React.createElement("span", {
    className: "dc-btn__spin"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "loading-03",
    spin: true,
    size: iconSize
  })) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.dc-ib{display:inline-grid;place-items:center;border-radius:var(--radius-lg);color:var(--icon-default);transition:var(--transition-tint),transform var(--dur-slow) var(--ease-spring-out);position:relative;overflow:hidden;flex:0 0 auto}
.dc-ib:active:not(:disabled){transform:scale(var(--press-scale-sm));transition-duration:var(--dur-instant)}
.dc-ib__i{position:relative;z-index:1;display:grid;place-items:center;transition:transform var(--dur-base) var(--ease-spring-out)}
.dc-ib:hover:not(:disabled) .dc-ib__i{transform:scale(1.09)}
.dc-ib[data-selected="true"] .dc-ib__i{animation:dc-mi-pop var(--dur-slow) var(--ease-spring-out)}
.dc-ib:disabled{color:var(--icon-disabled);cursor:not-allowed}
.dc-ib--sm{width:var(--icon-btn-sm);height:var(--icon-btn-sm)}
.dc-ib--md{width:var(--icon-btn-md);height:var(--icon-btn-md)}
.dc-ib--lg{width:var(--icon-btn-lg);height:var(--icon-btn-lg)}
.dc-ib--round{border-radius:var(--radius-full)}
.dc-ib--quiet{background:transparent}
.dc-ib--quiet:hover:not(:disabled){background:var(--surface-hover)}
.dc-ib--neutral{background:var(--control-neutral)}
.dc-ib--neutral:hover:not(:disabled){background:var(--control-neutral-hover)}
.dc-ib--float{background:var(--surface-float);box-shadow:var(--shadow-float)}
.dc-ib--float:hover:not(:disabled){background:var(--gray-50)}
.dc-ib--solid{background:var(--control-solid);color:var(--icon-inverse)}
.dc-ib--solid:hover:not(:disabled){background:var(--control-solid-hover)}
.dc-ib[data-selected="true"]{background:var(--control-solid);color:var(--icon-inverse)}
.dc-ib__dot{position:absolute;top:6px;right:6px;width:6px;height:6px;border-radius:var(--radius-full);background:var(--red-500);box-shadow:0 0 0 2px var(--surface-float)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-iconbutton-css")) {
  const el = document.createElement("style");
  el.id = "dc-iconbutton-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Square icon-only control: tool picks, rail actions, row affordances. */
function IconButton({
  icon,
  label,
  variant = "quiet",
  size = "md",
  selected = false,
  round = false,
  loading = false,
  disabled = false,
  badge = false,
  ripple = true,
  onPointerDown,
  className = "",
  style,
  ...rest
}) {
  const rip = __ds_scope.useRipple({
    disabled: disabled || !ripple
  });
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    "aria-pressed": selected || undefined,
    "data-selected": selected ? "true" : undefined,
    disabled: disabled,
    className: `dc-ib dc-ib--${size} dc-ib--${variant}${round ? " dc-ib--round" : ""} ${className}`,
    style: style,
    onPointerDown: __ds_scope.mergeHandlers(rip.onPointerDown, onPointerDown)
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "dc-ib__i"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: loading ? "loading-03" : icon,
    spin: loading,
    size: size === "sm" ? "sm" : size === "lg" ? "lg" : "md"
  })), rip.node, badge ? /*#__PURE__*/React.createElement("span", {
    className: "dc-ib__dot"
  }) : null);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
const CSS = `
.dc-pb{width:100%;height:6px;border-radius:var(--radius-full);background:var(--gray-200);overflow:hidden}
.dc-pb__fill{height:100%;border-radius:var(--radius-full);background:var(--blue-500);transition:width var(--dur-slow) var(--ease-out)}
.dc-pb--indeterminate .dc-pb__fill{width:38%;animation:dc-slide 1200ms var(--ease-in-out) infinite}
.dc-pb__row{display:flex;align-items:center;gap:var(--space-5)}
.dc-pb__label{font:var(--type-caption);color:var(--text-secondary);font-variant-numeric:tabular-nums;flex:0 0 auto}
@keyframes dc-slide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-progressbar-css")) {
  const el = document.createElement("style");
  el.id = "dc-progressbar-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Thin determinate or indeterminate bar — inline job status, upload rows. */
function ProgressBar({
  value = 0,
  indeterminate = false,
  label,
  color = "var(--blue-500)",
  className = "",
  style
}) {
  const bar = /*#__PURE__*/React.createElement("div", {
    className: `dc-pb${indeterminate ? " dc-pb--indeterminate" : ""}`,
    role: "progressbar",
    "aria-valuenow": indeterminate ? undefined : value
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-pb__fill",
    style: {
      width: indeterminate ? undefined : `${Math.max(0, Math.min(100, value))}%`,
      background: color
    }
  }));
  if (!label) return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: style
  }, bar);
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-pb__row ${className}`,
    style: style
  }, bar, /*#__PURE__*/React.createElement("span", {
    className: "dc-pb__label"
  }, label));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressRing.jsx
try { (() => {
const CSS = `
.dc-ring{position:relative;display:inline-grid;place-items:center;flex:0 0 auto}
.dc-ring svg{transform:rotate(-90deg)}
.dc-ring circle{fill:none;stroke-linecap:round}
.dc-ring__track{stroke:var(--gray-200)}
.dc-ring__arc{stroke:var(--blue-500);transition:stroke-dashoffset var(--dur-slow) var(--ease-out)}
.dc-ring__value{position:absolute;font:var(--type-mono);font-size:var(--text-xs);color:var(--text-secondary);font-variant-numeric:tabular-nums}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-ring-css")) {
  const el = document.createElement("style");
  el.id = "dc-ring-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Determinate circular progress — render jobs, uploads, generation percentage. */
function ProgressRing({
  value = 0,
  size = 40,
  strokeWidth = 3,
  showValue = false,
  color = "var(--blue-500)",
  className = "",
  style
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("span", {
    className: `dc-ring ${className}`,
    style: style,
    role: "progressbar",
    "aria-valuenow": pct
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size
  }, /*#__PURE__*/React.createElement("circle", {
    className: "dc-ring__track",
    cx: size / 2,
    cy: size / 2,
    r: r,
    strokeWidth: strokeWidth
  }), /*#__PURE__*/React.createElement("circle", {
    className: "dc-ring__arc",
    cx: size / 2,
    cy: size / 2,
    r: r,
    strokeWidth: strokeWidth,
    style: {
      stroke: color
    },
    strokeDasharray: c,
    strokeDashoffset: c - c * pct / 100
  })), showValue ? /*#__PURE__*/React.createElement("span", {
    className: "dc-ring__value"
  }, Math.round(pct)) : null);
}
Object.assign(__ds_scope, { ProgressRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressRing.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
const CSS = `
.dc-sk{display:block;background:var(--gray-150);background-image:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.85) 50%,transparent 100%);background-size:180% 100%;background-repeat:no-repeat;animation:dc-shimmer var(--dur-shimmer) var(--ease-in-out) infinite;border-radius:var(--radius-sm)}
.dc-sk--text{height:12px;border-radius:var(--radius-xs)}
.dc-sk--thumb{border-radius:var(--radius-xl);aspect-ratio:1/1;width:100%}
.dc-sk--circle{border-radius:var(--radius-full)}
.dc-sk--blur{filter:blur(0)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-skeleton-css")) {
  const el = document.createElement("style");
  el.id = "dc-skeleton-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Shimmering placeholder for content that is still loading in. */
function Skeleton({
  variant = "text",
  width,
  height,
  radius,
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: `dc-sk dc-sk--${variant} ${className}`,
    style: {
      width,
      height,
      borderRadius: radius,
      ...style
    },
    "aria-hidden": "true"
  });
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
const CSS = `
.dc-spin{display:inline-block;flex:0 0 auto;animation:dc-spin var(--dur-spin) linear infinite}
.dc-spin circle{fill:none;stroke-linecap:round}
.dc-spin__track{stroke:currentColor;opacity:.16}
.dc-spin__arc{stroke:currentColor}
.dc-spin--dots{display:inline-flex;gap:4px;align-items:center;animation:none}
.dc-spin--dots i{width:5px;height:5px;border-radius:var(--radius-full);background:currentColor;animation:dc-pulse 900ms var(--ease-in-out) infinite}
.dc-spin--dots i:nth-child(2){animation-delay:140ms}
.dc-spin--dots i:nth-child(3){animation-delay:280ms}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-spinner-css")) {
  const el = document.createElement("style");
  el.id = "dc-spinner-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Indeterminate loader. `arc` for anything spatial, `dots` for streaming text. */
function Spinner({
  size = 18,
  variant = "arc",
  color = "var(--text-secondary)",
  strokeWidth = 2,
  className = "",
  style
}) {
  if (variant === "dots") {
    return /*#__PURE__*/React.createElement("span", {
      className: `dc-spin dc-spin--dots ${className}`,
      style: {
        color,
        ...style
      },
      role: "status",
      "aria-label": "Loading"
    }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null));
  }
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  return /*#__PURE__*/React.createElement("svg", {
    className: `dc-spin ${className}`,
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    style: {
      color,
      ...style
    },
    role: "status",
    "aria-label": "Loading"
  }, /*#__PURE__*/React.createElement("circle", {
    className: "dc-spin__track",
    cx: size / 2,
    cy: size / 2,
    r: r,
    strokeWidth: strokeWidth
  }), /*#__PURE__*/React.createElement("circle", {
    className: "dc-spin__arc",
    cx: size / 2,
    cy: size / 2,
    r: r,
    strokeWidth: strokeWidth,
    strokeDasharray: `${c * 0.28} ${c}`
  }));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/ai/ChatMessage.jsx
try { (() => {
const CSS = `
.dc-cm{display:flex;gap:var(--space-6);max-width:560px}
.dc-cm--user{margin-left:auto;justify-content:flex-end}
.dc-cm__avatar{display:grid;place-items:center;width:28px;height:28px;border-radius:var(--radius-full);background:var(--surface-sunken);color:var(--icon-default);flex:0 0 auto}
.dc-cm__body{display:flex;flex-direction:column;gap:var(--space-4);min-width:0}
.dc-cm__bubble{padding:var(--space-6) var(--space-7);border-radius:var(--radius-2xl);font:var(--type-body);font-size:var(--text-md);color:var(--text-primary)}
.dc-cm--user .dc-cm__bubble{background:var(--surface-sunken);border-bottom-right-radius:var(--radius-xs)}
.dc-cm--ai .dc-cm__bubble{padding-left:0;padding-top:var(--space-3)}
.dc-cm__meta{display:flex;align-items:center;gap:var(--space-4);font:var(--type-caption);color:var(--text-tertiary)}
.dc-cm__attach{display:flex;gap:var(--space-4)}
.dc-cm__attach img{width:64px;height:64px;object-fit:cover;border-radius:var(--radius-lg);background:var(--surface-sunken)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-chatmessage-css")) {
  const el = document.createElement("style");
  el.id = "dc-chatmessage-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** One turn in the assistant thread. */
function ChatMessage({
  role = "ai",
  children,
  meta,
  attachments = [],
  streaming = false,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-cm dc-cm--${role} ${className}`
  }, role === "ai" ? /*#__PURE__*/React.createElement("span", {
    className: "dc-cm__avatar"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "sparkles",
    size: "sm"
  })) : null, /*#__PURE__*/React.createElement("div", {
    className: "dc-cm__body"
  }, attachments.length ? /*#__PURE__*/React.createElement("div", {
    className: "dc-cm__attach"
  }, attachments.map((a, i) => /*#__PURE__*/React.createElement("img", {
    key: i,
    src: a,
    alt: ""
  }))) : null, /*#__PURE__*/React.createElement("div", {
    className: "dc-cm__bubble"
  }, children, streaming ? /*#__PURE__*/React.createElement(__ds_scope.Spinner, {
    variant: "dots",
    color: "var(--text-tertiary)",
    style: {
      marginLeft: 6,
      verticalAlign: "middle"
    }
  }) : null), meta ? /*#__PURE__*/React.createElement("span", {
    className: "dc-cm__meta"
  }, meta) : null));
}
Object.assign(__ds_scope, { ChatMessage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ai/ChatMessage.jsx", error: String((e && e.message) || e) }); }

// components/ai/PromptComposer.jsx
try { (() => {
const CSS = `
.dc-pc{display:flex;flex-direction:column;gap:var(--space-6);padding:var(--space-7);background:var(--surface-float);border-radius:var(--radius-3xl);box-shadow:var(--shadow-panel);transition:box-shadow var(--dur-base) var(--ease-out)}
.dc-pc:focus-within{box-shadow:var(--shadow-pop)}
.dc-pc__input{width:100%;min-height:24px;max-height:120px;resize:none;border:0;background:none;font:var(--type-body);font-size:var(--text-md);color:var(--text-primary);overflow:auto}
.dc-pc__input::placeholder{color:var(--text-tertiary)}
.dc-pc__row{display:flex;align-items:center;gap:var(--space-5)}
.dc-pc__grow{flex:1 1 auto}
.dc-pc__chip{display:inline-flex;align-items:center;gap:var(--space-3);height:var(--control-h-md);padding:0 var(--space-5);border-radius:var(--radius-md);background:var(--surface-sunken);font:var(--type-label);color:var(--text-primary);transition:var(--transition-tint)}
.dc-pc__chip:hover{background:var(--surface-hover)}
.dc-pc__send{display:grid;place-items:center;width:var(--icon-btn-md);height:var(--icon-btn-md);border-radius:var(--radius-lg);background:var(--control-neutral);color:var(--icon-default);transition:var(--transition-tint),transform var(--dur-instant) var(--ease-out)}
.dc-pc__send:hover{background:var(--control-neutral-hover)}
.dc-pc__send:active{transform:scale(var(--press-scale))}
.dc-pc__send[data-ready="true"]{background:var(--control-solid);color:var(--icon-inverse)}
.dc-pc--bare{box-shadow:var(--shadow-float)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-composer-css")) {
  const el = document.createElement("style");
  el.id = "dc-composer-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** The prompt bar that floats at the bottom of every canvas: input plus a row of affordances. */
function PromptComposer({
  value = "",
  onChange,
  onSubmit,
  placeholder = "Describe your 3D object or scene…",
  preset,
  model,
  busy = false,
  onAttach,
  onPickPreset,
  onPickModel,
  onVoice,
  elevation = "panel",
  className = "",
  style
}) {
  const ready = value.trim().length > 0 && !busy;
  return /*#__PURE__*/React.createElement("form", {
    className: `dc-pc${elevation === "float" ? " dc-pc--bare" : ""} ${className}`,
    style: style,
    onSubmit: e => {
      e.preventDefault();
      if (ready && onSubmit) onSubmit(value);
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    className: "dc-pc__input",
    rows: 1,
    value: value,
    placeholder: placeholder,
    onChange: e => onChange && onChange(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (ready && onSubmit) onSubmit(value);
      }
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "dc-pc__row"
  }, onAttach ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "plus-sign",
    label: "Attach reference",
    variant: "neutral",
    onClick: onAttach
  }) : null, preset ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dc-pc__chip",
    onClick: onPickPreset
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "flash",
    size: "sm",
    color: "var(--green-500)"
  }), preset, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-down-01",
    size: "sm",
    color: "var(--icon-muted)"
  })) : null, /*#__PURE__*/React.createElement("span", {
    className: "dc-pc__grow"
  }), model ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dc-pc__chip",
    style: {
      background: "transparent"
    },
    onClick: onPickModel
  }, model, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-down-01",
    size: "sm",
    color: "var(--icon-muted)"
  })) : null, onVoice ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "mic-01",
    label: "Dictate",
    onClick: onVoice
  }) : null, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "dc-pc__send",
    "data-ready": ready ? "true" : undefined,
    "aria-label": "Send prompt"
  }, busy ? /*#__PURE__*/React.createElement(__ds_scope.Spinner, {
    size: 16,
    color: "currentColor"
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-up-02"
  }))));
}
Object.assign(__ds_scope, { PromptComposer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ai/PromptComposer.jsx", error: String((e && e.message) || e) }); }

// components/feedback/CanvasLoader.jsx
try { (() => {
const CSS = `
.dc-cl{display:inline-flex;align-items:center;gap:var(--space-6);padding:var(--space-5) var(--space-7) var(--space-5) var(--space-6);background:var(--surface-glass);backdrop-filter:var(--blur-glass);-webkit-backdrop-filter:var(--blur-glass);border-radius:var(--radius-full);box-shadow:var(--shadow-float);animation:dc-float-in var(--dur-base) var(--ease-out)}
.dc-cl__text{display:flex;flex-direction:column;gap:1px}
.dc-cl__title{font:var(--type-label)}
.dc-cl__sub{font:var(--type-caption);color:var(--text-tertiary);font-variant-numeric:tabular-nums}
.dc-cl--block{flex-direction:column;gap:var(--space-6);padding:var(--space-11);border-radius:var(--radius-3xl);text-align:center}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-canvasloader-css")) {
  const el = document.createElement("style");
  el.id = "dc-canvasloader-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Frosted status capsule that floats over the canvas while a scene renders. */
function CanvasLoader({
  title = "Rendering scene",
  detail,
  progress,
  layout = "capsule",
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-cl${layout === "block" ? " dc-cl--block" : ""} ${className}`,
    style: style,
    role: "status"
  }, typeof progress === "number" ? /*#__PURE__*/React.createElement(__ds_scope.ProgressRing, {
    value: progress,
    size: 28,
    strokeWidth: 2.5
  }) : /*#__PURE__*/React.createElement(__ds_scope.Spinner, {
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    className: "dc-cl__text"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dc-cl__title"
  }, title), detail ? /*#__PURE__*/React.createElement("span", {
    className: "dc-cl__sub"
  }, detail) : null));
}
Object.assign(__ds_scope, { CanvasLoader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/CanvasLoader.jsx", error: String((e && e.message) || e) }); }

// components/inputs/ColorField.jsx
try { (() => {
const CSS = `
.dc-cf{display:flex;align-items:center;height:var(--control-h-lg);background:var(--surface-sunken);border-radius:var(--radius-md);overflow:hidden}
.dc-cf__swatchwrap{display:grid;place-items:center;width:38px;height:100%;flex:0 0 auto}
.dc-cf__swatch{width:22px;height:22px;border-radius:var(--radius-xs);box-shadow:inset 0 0 0 1px rgba(0,0,0,.10);cursor:pointer;transition:transform var(--dur-fast) var(--ease-out)}
.dc-cf__swatch:hover{transform:scale(1.08)}
.dc-cf__hex{flex:1 1 auto;min-width:0;background:none;border:0;font:var(--type-mono);letter-spacing:var(--tracking-wide);color:var(--text-primary);text-transform:uppercase}
.dc-cf__opacity{display:flex;align-items:center;gap:var(--space-2);padding:0 var(--space-6) 0 var(--space-5);height:100%;box-shadow:inset 1px 0 0 var(--border-subtle)}
.dc-cf__opacity input{width:30px;background:none;border:0;font:var(--type-mono);color:var(--text-primary);font-variant-numeric:tabular-nums}
.dc-cf__pct{font:var(--type-caption);color:var(--text-tertiary)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-colorfield-css")) {
  const el = document.createElement("style");
  el.id = "dc-colorfield-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Hex + opacity row used for backgrounds and material colours. */
function ColorField({
  value = "#F4F4F4",
  opacity = 100,
  onChange,
  onOpacityChange,
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-cf ${className}`,
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "dc-cf__swatchwrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dc-cf__swatch",
    style: {
      background: value
    }
  })), /*#__PURE__*/React.createElement("input", {
    className: "dc-cf__hex",
    value: value.replace("#", ""),
    spellCheck: false,
    onChange: e => onChange && onChange(`#${e.target.value.replace("#", "")}`)
  }), /*#__PURE__*/React.createElement("span", {
    className: "dc-cf__opacity"
  }, /*#__PURE__*/React.createElement("input", {
    value: opacity,
    onChange: e => onOpacityChange && onOpacityChange(Number(e.target.value) || 0)
  }), /*#__PURE__*/React.createElement("span", {
    className: "dc-cf__pct"
  }, "%")));
}
Object.assign(__ds_scope, { ColorField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/ColorField.jsx", error: String((e && e.message) || e) }); }

// components/inputs/NumberField.jsx
try { (() => {
const CSS = `
.dc-nf{display:inline-flex;align-items:center;gap:var(--space-3);height:var(--control-h-md);padding:0 var(--space-5);background:var(--surface-sunken);border-radius:var(--radius-md);transition:var(--transition-tint)}
.dc-nf:hover{background:var(--surface-hover)}
.dc-nf:focus-within{box-shadow:inset 0 0 0 1px var(--blue-500)}
.dc-nf__icon{color:var(--icon-muted)}
.dc-nf__input{width:52px;background:none;border:0;font:var(--type-mono);color:var(--text-primary);font-variant-numeric:tabular-nums;text-align:left}
.dc-nf__suffix{font:var(--type-caption);color:var(--text-tertiary)}
.dc-nf__scrub{color:var(--icon-muted);cursor:ew-resize;transition:color var(--dur-fast) var(--ease-out),transform var(--dur-base) var(--ease-spring-out)}
.dc-nf:hover .dc-nf__scrub{color:var(--icon-default);animation:dc-mi-bob-x var(--dur-slower) var(--ease-in-out)}
.dc-nf__scrub:active{transform:scale(.88)}
.dc-nf:focus-within .dc-nf__input{color:var(--text-primary)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-numberfield-css")) {
  const el = document.createElement("style");
  el.id = "dc-numberfield-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Compact numeric readout with a scrub handle — the "0.283" / "100 %" inspector fields. */
function NumberField({
  value = 0,
  onChange,
  suffix,
  scrub = true,
  step = 0.001,
  min,
  max,
  width = 52,
  className = "",
  style
}) {
  const clamp = n => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-nf ${className}`,
    style: style
  }, scrub ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-data-transfer-horizontal",
    size: "sm",
    className: "dc-nf__scrub"
  }) : null, /*#__PURE__*/React.createElement("input", {
    className: "dc-nf__input",
    type: "number",
    value: value,
    step: step,
    min: min,
    max: max,
    style: {
      width
    },
    onChange: e => onChange && onChange(clamp(Number(e.target.value)))
  }), suffix ? /*#__PURE__*/React.createElement("span", {
    className: "dc-nf__suffix"
  }, suffix) : null);
}
Object.assign(__ds_scope, { NumberField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/NumberField.jsx", error: String((e && e.message) || e) }); }

// components/inputs/SegmentedControl.jsx
try { (() => {
const CSS = `
.dc-seg{display:inline-flex;align-items:center;gap:var(--space-1);padding:var(--space-1);background:var(--surface-sunken);border-radius:var(--radius-lg);position:relative}
.dc-seg--full{display:flex;width:100%}
.dc-seg__item{position:relative;flex:1 1 auto;height:30px;padding:0 var(--space-7);border-radius:var(--radius-md);font:var(--type-label);color:var(--text-tertiary);white-space:nowrap;transition:color var(--dur-fast) var(--ease-out)}
.dc-seg__item:hover{color:var(--text-secondary)}
.dc-seg__item[data-on="true"]{color:var(--text-primary)}
.dc-seg__item{transition:color var(--dur-fast) var(--ease-out),transform var(--dur-slow) var(--ease-spring-out)}
.dc-seg__item:active{transform:scale(.96)}
.dc-seg__thumb{position:absolute;top:var(--space-1);bottom:var(--space-1);background:var(--gray-0);border-radius:var(--radius-md);box-shadow:var(--shadow-pill);transform-origin:center;transition:left var(--dur-base) var(--ease-spring-out),width var(--dur-base) var(--ease-out),transform var(--dur-fast) var(--ease-out)}
.dc-seg__thumb[data-moving="true"]{transform:scaleY(.86)}
.dc-seg--lg .dc-seg__item{height:34px}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-segmented-css")) {
  const el = document.createElement("style");
  el.id = "dc-segmented-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Sliding-pill segmented control: Scene/Assets, Design/Animation, Isometric/Perspective. */
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = "md",
  full = false,
  className = "",
  style
}) {
  const items = options.map(o => typeof o === "string" ? {
    value: o,
    label: o
  } : o);
  const idx = Math.max(0, items.findIndex(o => o.value === value));
  const w = items.length ? 100 / items.length : 100;
  const [moving, setMoving] = React.useState(false);
  const timer = React.useRef(0);
  const travel = () => {
    setMoving(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMoving(false), 200);
  };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-seg dc-seg--${size}${full ? " dc-seg--full" : ""} ${className}`,
    role: "tablist",
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "dc-seg__thumb",
    "data-moving": moving ? "true" : undefined,
    style: {
      left: `calc(${idx * w}% + 2px)`,
      width: `calc(${w}% - 4px)`
    }
  }), items.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "tab",
    "aria-selected": o.value === value,
    "data-on": o.value === value ? "true" : "false",
    className: "dc-seg__item",
    onClick: () => {
      travel();
      onChange && onChange(o.value);
    }
  }, o.label)));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Slider.jsx
try { (() => {
const CSS = `
.dc-sl{display:flex;flex-direction:column;gap:var(--space-3);width:100%}
.dc-sl__head{display:flex;align-items:baseline;justify-content:space-between;gap:var(--space-4)}
.dc-sl__label{font:var(--type-label);color:var(--text-primary)}
.dc-sl--off .dc-sl__label{color:var(--text-tertiary)}
.dc-sl__value{font:var(--type-mono);color:var(--text-secondary);font-variant-numeric:tabular-nums}
.dc-sl__track{position:relative;height:32px;border-radius:var(--radius-md);background:var(--control-track);box-shadow:var(--shadow-track);overflow:hidden;cursor:ew-resize}
.dc-sl__fill{position:absolute;top:0;bottom:0;background:var(--control-fill);transition:background-color var(--dur-fast) var(--ease-out)}
.dc-sl--off .dc-sl__fill{background:transparent}
.dc-sl__thumb{position:absolute;top:0;bottom:0;width:12px;border-radius:var(--radius-xs);background:var(--control-thumb);box-shadow:var(--shadow-pill);transform:translateX(-50%) scaleX(var(--mi-tw,1));transition:box-shadow var(--dur-fast) var(--ease-out),transform var(--dur-base) var(--ease-spring-out)}
.dc-sl__track:hover .dc-sl__thumb{box-shadow:0 1px 3px rgba(0,0,0,.16);--mi-tw:1.12}
.dc-sl__track:active .dc-sl__thumb{--mi-tw:1.3;box-shadow:0 0 0 4px rgba(13,13,13,.06),0 1px 4px rgba(0,0,0,.2)}
.dc-sl__value{transition:color var(--dur-fast) var(--ease-out)}
.dc-sl:hover .dc-sl__value{color:var(--text-primary)}
.dc-sl__input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize}
.dc-sl--sm .dc-sl__track{height:24px}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-slider-css")) {
  const el = document.createElement("style");
  el.id = "dc-slider-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Chunky track slider — the inspector's primary numeric control. */
function Slider({
  label,
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  showValue = false,
  format,
  size = "md",
  origin = "left",
  className = "",
  style
}) {
  const pct = (value - min) / (max - min) * 100;
  const active = pct > 0.5;
  const fill = origin === "center" ? {
    left: `${Math.min(50, pct)}%`,
    width: `${Math.abs(pct - 50)}%`
  } : {
    left: 0,
    width: `${pct}%`
  };
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-sl dc-sl--${size}${active ? "" : " dc-sl--off"} ${className}`,
    style: style
  }, label || showValue ? /*#__PURE__*/React.createElement("div", {
    className: "dc-sl__head"
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "dc-sl__label"
  }, label) : null, showValue ? /*#__PURE__*/React.createElement("span", {
    className: "dc-sl__value"
  }, format ? format(value) : value) : null) : null, /*#__PURE__*/React.createElement("div", {
    className: "dc-sl__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dc-sl__fill",
    style: fill
  }), /*#__PURE__*/React.createElement("span", {
    className: "dc-sl__thumb",
    style: {
      left: `${pct}%`
    }
  }), /*#__PURE__*/React.createElement("input", {
    className: "dc-sl__input",
    type: "range",
    "aria-label": label,
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange && onChange(Number(e.target.value))
  })));
}
Object.assign(__ds_scope, { Slider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Slider.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Switch.jsx
try { (() => {
const CSS = `
.dc-sw{display:inline-flex;align-items:center;gap:var(--space-5);cursor:pointer;-webkit-user-select:none;user-select:none}
.dc-sw__track{position:relative;width:44px;height:26px;border-radius:var(--radius-full);background:var(--gray-300);transition:background-color var(--dur-base) var(--ease-out);flex:0 0 auto}
.dc-sw__track{transition:background-color var(--dur-base) var(--ease-out),transform var(--dur-base) var(--ease-spring-out)}
.dc-sw:active .dc-sw__track{transform:scale(.95)}
.dc-sw__thumb{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:var(--radius-full);background:var(--gray-0);box-shadow:var(--shadow-pill);transition:transform var(--dur-base) var(--ease-spring)}
.dc-sw__thumb::after{content:"";position:absolute;inset:-5px;border-radius:var(--radius-full);border:2px solid var(--control-solid);opacity:0}
.dc-sw[data-on="true"] .dc-sw__thumb::after{animation:dc-mi-ring var(--dur-slower) var(--ease-out)}
.dc-sw[data-accent="true"][data-on="true"] .dc-sw__thumb::after{border-color:var(--blue-500)}
.dc-sw[data-on="true"] .dc-sw__track{background:var(--control-solid)}
.dc-sw[data-on="true"] .dc-sw__thumb{transform:translateX(18px)}
.dc-sw[data-accent="true"][data-on="true"] .dc-sw__track{background:var(--blue-500)}
.dc-sw:hover .dc-sw__track{filter:brightness(.96)}
.dc-sw[data-disabled="true"]{cursor:not-allowed;opacity:.5}
.dc-sw__label{font:var(--type-label)}
.dc-sw--sm .dc-sw__track{width:34px;height:20px}
.dc-sw--sm .dc-sw__thumb{width:16px;height:16px;top:2px;left:2px}
.dc-sw--sm[data-on="true"] .dc-sw__thumb{transform:translateX(14px)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-switch-css")) {
  const el = document.createElement("style");
  el.id = "dc-switch-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Binary toggle. Reads on/off at a glance — near-black when on. */
function Switch({
  checked = false,
  onChange,
  label,
  accent = false,
  size = "md",
  disabled = false,
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: `dc-sw dc-sw--${size} ${className}`,
    "data-on": checked ? "true" : "false",
    "data-accent": accent ? "true" : undefined,
    "data-disabled": disabled ? "true" : undefined,
    style: style
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "dc-sw__label"
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    className: "dc-sw__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dc-sw__thumb"
  })), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    role: "switch",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Switch.jsx", error: String((e && e.message) || e) }); }

// components/inputs/TextField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.dc-tf{display:flex;align-items:center;gap:var(--space-4);height:var(--control-h-lg);padding:0 var(--space-6);background:var(--surface-float);border-radius:var(--radius-lg);box-shadow:inset 0 0 0 1px var(--border-default);transition:box-shadow var(--dur-fast) var(--ease-out),background-color var(--dur-fast) var(--ease-out)}
.dc-tf:hover{box-shadow:inset 0 0 0 1px var(--border-strong)}
.dc-tf:focus-within{box-shadow:inset 0 0 0 1px var(--blue-500),var(--shadow-focus)}
.dc-tf--sunken{background:var(--surface-sunken);box-shadow:none}
.dc-tf--sunken:hover{background:var(--surface-hover);box-shadow:none}
.dc-tf--quiet{background:transparent;box-shadow:none}
.dc-tf--sm{height:var(--control-h-md)}
.dc-tf__input{flex:1 1 auto;min-width:0;background:none;border:0;font:var(--type-body);color:var(--text-primary)}
.dc-tf__input::placeholder{color:var(--text-tertiary)}
.dc-tf__icon{color:var(--icon-muted);flex:0 0 auto}
.dc-tf__kbd{display:inline-flex;align-items:center;gap:2px;height:20px;padding:0 var(--space-3);border-radius:var(--radius-xs);background:var(--surface-sunken);box-shadow:inset 0 0 0 1px var(--border-subtle);font:var(--type-caption);color:var(--text-tertiary);flex:0 0 auto}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-textfield-css")) {
  const el = document.createElement("style");
  el.id = "dc-textfield-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Single-line text input with optional leading icon and trailing shortcut chip. */
function TextField({
  value,
  onChange,
  placeholder,
  icon,
  kbd,
  variant = "default",
  size = "md",
  type = "text",
  disabled = false,
  className = "",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-tf dc-tf--${variant} dc-tf--${size} ${className}`,
    style: style
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    className: "dc-tf__icon"
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    className: "dc-tf__input",
    type: type,
    value: value,
    placeholder: placeholder,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.value)
  }, rest)), kbd ? /*#__PURE__*/React.createElement("span", {
    className: "dc-tf__kbd"
  }, kbd) : null);
}

/** TextField preset for the search affordances in the sidebar and file browser. */
function SearchField({
  placeholder = "Search…",
  kbd = "⌘K",
  variant = "sunken",
  ...rest
}) {
  return /*#__PURE__*/React.createElement(TextField, _extends({
    icon: "search-01",
    placeholder: placeholder,
    kbd: kbd,
    variant: variant
  }, rest));
}
Object.assign(__ds_scope, { TextField, SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/TextField.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Accordion.jsx
try { (() => {
const CSS = `
.dc-acc{display:flex;flex-direction:column;width:100%}
.dc-acc__item+.dc-acc__item{box-shadow:inset 0 1px 0 var(--border-subtle)}
.dc-acc__head{display:flex;align-items:center;gap:var(--space-5);width:100%;padding:var(--space-6) 0;font:var(--type-section-label);color:var(--text-primary);text-align:left;cursor:pointer;-webkit-user-select:none;user-select:none;transition:color var(--dur-fast) var(--ease-out)}
.dc-acc__head:hover{color:var(--text-secondary)}
.dc-acc__title{flex:1 1 auto}
.dc-acc__meta{font:var(--type-caption);color:var(--text-tertiary)}
.dc-acc__chev{color:var(--icon-muted);transition:transform var(--dur-slow) var(--ease-out)}
.dc-acc__item[data-open="true"] .dc-acc__chev{transform:rotate(180deg)}
.dc-acc__body{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--dur-slow) var(--ease-out)}
.dc-acc__item[data-open="true"] .dc-acc__body{grid-template-rows:1fr}
.dc-acc__inner{overflow:hidden;min-height:0}
.dc-acc__pad{padding-bottom:var(--space-7)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-accordion-css")) {
  const el = document.createElement("style");
  el.id = "dc-accordion-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Container for AccordionItems — the inspector's expand/collapse stack. */
function Accordion({
  children,
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-acc ${className}`,
    style: style
  }, children);
}

/** One collapsible section. Uncontrolled unless `open` is supplied. */
function AccordionItem({
  title,
  meta,
  action,
  defaultOpen = true,
  open: openProp,
  onToggle,
  children
}) {
  const [state, setState] = React.useState(defaultOpen);
  const open = openProp !== undefined ? openProp : state;
  return /*#__PURE__*/React.createElement("div", {
    className: "dc-acc__item",
    "data-open": open ? "true" : "false"
  }, /*#__PURE__*/React.createElement("div", {
    role: "button",
    tabIndex: 0,
    className: "dc-acc__head",
    "aria-expanded": open,
    onClick: () => {
      setState(!open);
      onToggle && onToggle(!open);
    },
    onKeyDown: e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setState(!open);
        onToggle && onToggle(!open);
      }
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dc-acc__title"
  }, title), meta ? /*#__PURE__*/React.createElement("span", {
    className: "dc-acc__meta"
  }, meta) : null, action ? /*#__PURE__*/React.createElement("span", {
    onClick: e => e.stopPropagation()
  }, action) : null, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-down-01",
    size: "sm",
    className: "dc-acc__chev"
  })), /*#__PURE__*/React.createElement("div", {
    className: "dc-acc__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-acc__inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-acc__pad"
  }, children))));
}
Object.assign(__ds_scope, { Accordion, AccordionItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Accordion.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.dc-sb{display:flex;flex-direction:column;gap:var(--space-1);width:100%}
.dc-sb__label{padding:var(--space-6) var(--space-5) var(--space-2);font:var(--type-caption);color:var(--text-tertiary)}
.dc-sbi{display:flex;align-items:center;gap:var(--space-5);width:100%;height:var(--row-h);padding:0 var(--space-4);border-radius:var(--radius-md);font:var(--type-label);font-size:var(--text-md);color:var(--text-primary);text-align:left;transition:background-color var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)}
.dc-sbi:hover{background:var(--surface-hover)}
.dc-sbi[data-active="true"]{background:var(--surface-selected)}
.dc-sbi__chip{display:grid;place-items:center;width:28px;height:28px;border-radius:var(--radius-sm);color:var(--icon-default);flex:0 0 auto;transition:background-color var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out)}
.dc-sbi[data-active="true"] .dc-sbi__chip{background:var(--gray-0);box-shadow:var(--shadow-pill)}
.dc-sbi__text{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-sbi__count{display:inline-flex;align-items:center;height:20px;padding:0 var(--space-4);border-radius:var(--radius-xs);background:var(--surface-sunken);font:var(--type-caption);color:var(--text-secondary);font-variant-numeric:tabular-nums;flex:0 0 auto}
.dc-sbi[data-active="true"] .dc-sbi__count{background:var(--gray-0)}
.dc-sbi__chev{color:var(--icon-muted);transition:transform var(--dur-base) var(--ease-out);flex:0 0 auto}
.dc-sbi[data-open="true"] .dc-sbi__chev{transform:rotate(180deg)}
.dc-sbi--child{height:32px;padding-left:var(--space-11);color:var(--text-secondary);font-weight:var(--weight-regular);position:relative}
.dc-sbi--child::before{content:"";position:absolute;left:24px;top:50%;width:10px;height:1px;background:var(--border-strong)}
.dc-sbi--child[data-active="true"]{color:var(--text-primary);background:transparent;font-weight:var(--weight-medium)}
.dc-sb__nest{display:flex;flex-direction:column;gap:var(--space-1);position:relative;overflow:hidden;transition:height var(--dur-slow) var(--ease-out)}
.dc-sb__nest::before{content:"";position:absolute;left:24px;top:0;bottom:12px;width:1px;background:var(--border-subtle)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-sidebar-css")) {
  const el = document.createElement("style");
  el.id = "dc-sidebar-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Vertical navigation stack for the app sidebar. */
function Sidebar({
  children,
  className = "",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: `dc-sb ${className}`,
    style: style
  }, rest), children);
}

/** Muted group heading, e.g. "My scenes". */
function SidebarLabel({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "dc-sb__label"
  }, children);
}

/**
 * One navigation row. Pass `children` to make it an expander — nested rows render
 * indented with a hairline tree connector.
 */
function SidebarItem({
  icon,
  label,
  active = false,
  count,
  iconColor,
  expandable = false,
  open = false,
  onToggle,
  onClick,
  children,
  indent = false,
  ...rest
}) {
  const isExpander = expandable || !!children;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: `dc-sbi${indent ? " dc-sbi--child" : ""}`,
    "data-active": active ? "true" : "false",
    "data-open": open ? "true" : "false",
    "aria-expanded": isExpander ? open : undefined,
    onClick: isExpander && onToggle ? onToggle : onClick
  }, rest), icon && !indent ? /*#__PURE__*/React.createElement("span", {
    className: "dc-sbi__chip"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    color: iconColor
  })) : null, /*#__PURE__*/React.createElement("span", {
    className: "dc-sbi__text"
  }, label), count !== undefined ? /*#__PURE__*/React.createElement("span", {
    className: "dc-sbi__count"
  }, count) : null, isExpander ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-down-01",
    size: "sm",
    className: "dc-sbi__chev"
  }) : null), isExpander && children ? /*#__PURE__*/React.createElement("div", {
    className: "dc-sb__nest",
    style: {
      height: open ? "auto" : 0
    }
  }, children) : null);
}
Object.assign(__ds_scope, { Sidebar, SidebarLabel, SidebarItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const CSS = `
.dc-tabs{display:flex;align-items:center;gap:var(--space-9);box-shadow:inset 0 -1px 0 var(--border-subtle)}
.dc-tab{position:relative;height:38px;font:var(--type-label);color:var(--text-tertiary);transition:color var(--dur-fast) var(--ease-out)}
.dc-tab:hover{color:var(--text-secondary)}
.dc-tab[data-on="true"]{color:var(--text-primary)}
.dc-tab{transition:color var(--dur-fast) var(--ease-out),transform var(--dur-base) var(--ease-spring-out)}
.dc-tab:hover{transform:translateY(-1px)}
.dc-tab:active{transform:translateY(0) scale(.97)}
.dc-tab::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:2px;background:var(--control-solid);opacity:0;transform:scaleX(0);transform-origin:center;transition:transform var(--dur-base) var(--ease-spring-out),opacity var(--dur-fast) var(--ease-out)}
.dc-tab:hover::after{opacity:.22;transform:scaleX(1)}
.dc-tab[data-on="true"]::after{opacity:1;transform:scaleX(1)}
.dc-tab__count{margin-left:var(--space-3);font-family:var(--font-mono);font-size:var(--text-xs);color:var(--text-tertiary)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-tabs-css")) {
  const el = document.createElement("style");
  el.id = "dc-tabs-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Underlined tabs for switching content within a screen. */
function Tabs({
  items = [],
  value,
  onChange,
  className = "",
  style
}) {
  const opts = items.map(i => typeof i === "string" ? {
    value: i,
    label: i
  } : i);
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-tabs ${className}`,
    role: "tablist",
    style: style
  }, opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "tab",
    className: "dc-tab",
    "aria-selected": o.value === value,
    "data-on": o.value === value ? "true" : "false",
    onClick: () => onChange && onChange(o.value)
  }, o.label, o.count !== undefined ? /*#__PURE__*/React.createElement("span", {
    className: "dc-tab__count"
  }, o.count) : null)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlays/DropdownMenu.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.dc-dd{position:relative;display:inline-flex}
.dc-dd__trigger{display:inline-flex;align-items:center;gap:var(--space-3);height:var(--control-h-md);padding:0 var(--space-4) 0 var(--space-6);border-radius:var(--radius-md);font:var(--type-label);color:var(--text-primary);background:transparent;transition:var(--transition-tint)}
.dc-dd__trigger:hover{background:var(--surface-hover)}
.dc-dd__trigger[data-open="true"]{background:var(--surface-active)}
.dc-dd__trigger--sunken{background:var(--surface-sunken)}
.dc-dd__chev{color:var(--icon-muted);transition:transform var(--dur-base) var(--ease-out)}
.dc-dd__trigger[data-open="true"] .dc-dd__chev{transform:rotate(180deg)}
.dc-dd__menu{position:absolute;z-index:70;min-width:184px;padding:var(--space-3);background:var(--surface-float);border-radius:var(--radius-2xl);box-shadow:var(--shadow-pop);animation:dc-float-in var(--dur-base) var(--ease-out);transform-origin:top left}
.dc-dd__menu[data-align="start"]{left:0}
.dc-dd__menu[data-align="end"]{right:0}
.dc-dd__menu[data-side="bottom"]{top:calc(100% + 6px)}
.dc-dd__menu[data-side="top"]{bottom:calc(100% + 6px)}
.dc-dd__label{padding:var(--space-3) var(--space-4) var(--space-2);font:var(--type-caption);color:var(--text-tertiary)}
.dc-dd__menu>*{animation:dc-mi-item-in var(--dur-base) var(--ease-out) both}
.dc-dd__menu>*:nth-child(1){animation-delay:10ms}
.dc-dd__menu>*:nth-child(2){animation-delay:26ms}
.dc-dd__menu>*:nth-child(3){animation-delay:42ms}
.dc-dd__menu>*:nth-child(4){animation-delay:58ms}
.dc-dd__menu>*:nth-child(5){animation-delay:74ms}
.dc-dd__menu>*:nth-child(n+6){animation-delay:90ms}
.dc-mi{position:relative;display:flex;align-items:center;gap:var(--space-5);width:100%;height:34px;padding:0 var(--space-5);border-radius:var(--radius-md);font:var(--type-label);color:var(--text-primary);text-align:left;transition:background-color var(--dur-fast) var(--ease-out),transform var(--dur-fast) var(--ease-out)}
.dc-mi:hover{background:var(--surface-hover)}
.dc-mi:active:not(:disabled){transform:scale(.985)}
.dc-mi__icon{color:var(--icon-muted);transition:transform var(--dur-base) var(--ease-spring-out),color var(--dur-fast) var(--ease-out)}
.dc-mi:hover .dc-mi__icon{transform:translateX(1px) scale(1.08);color:var(--icon-default)}
.dc-mi__check{animation:dc-mi-pop var(--dur-base) var(--ease-spring-out)}
.dc-mi__grow{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-mi__hint{font-family:var(--font-mono);font-size:var(--text-xs);color:var(--text-tertiary)}
.dc-mi[data-selected="true"] .dc-mi__check{color:var(--blue-500)}
.dc-mi[data-danger="true"]{color:var(--red-600)}
.dc-mi[data-danger="true"] .dc-mi__icon{color:var(--red-500)}
.dc-mi[data-danger="true"]:hover{background:var(--red-50)}
.dc-mi:disabled{color:var(--text-disabled);cursor:not-allowed;background:none}
.dc-dd__sep{height:1px;margin:var(--space-3) calc(var(--space-3) * -1);background:var(--border-subtle)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-dropdown-css")) {
  const el = document.createElement("style");
  el.id = "dc-dropdown-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Click-to-open menu: model pickers, layer overflow, file actions. */
function DropdownMenu({
  label,
  icon,
  children,
  align = "start",
  side = "bottom",
  sunken = false,
  open: openProp,
  onOpenChange,
  trigger,
  className = "",
  style
}) {
  const [openState, setOpenState] = React.useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = v => {
    setOpenState(v);
    onOpenChange && onOpenChange(v);
  };
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-dd ${className}`,
    ref: ref,
    style: style
  }, trigger ? /*#__PURE__*/React.createElement("span", {
    onClick: () => setOpen(!open)
  }, trigger) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    "data-open": open ? "true" : "false",
    "aria-expanded": open,
    className: `dc-dd__trigger${sunken ? " dc-dd__trigger--sunken" : ""}`,
    onClick: () => setOpen(!open)
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: "sm"
  }) : null, label, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-down-01",
    size: "sm",
    className: "dc-dd__chev"
  })), open ? /*#__PURE__*/React.createElement("div", {
    className: "dc-dd__menu",
    "data-align": align,
    "data-side": side,
    role: "menu",
    onClick: () => setOpen(false)
  }, children) : null);
}

/** A row inside a DropdownMenu. */
function MenuItem({
  children,
  icon,
  hint,
  selected = false,
  danger = false,
  disabled = false,
  onClick,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "menuitem",
    className: "dc-mi",
    disabled: disabled,
    "data-selected": selected ? "true" : undefined,
    "data-danger": danger ? "true" : undefined,
    onClick: onClick
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: "sm",
    className: "dc-mi__icon"
  }) : null, /*#__PURE__*/React.createElement("span", {
    className: "dc-mi__grow"
  }, children), hint ? /*#__PURE__*/React.createElement("span", {
    className: "dc-mi__hint"
  }, hint) : null, selected ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "tick-02",
    size: "sm",
    className: "dc-mi__check"
  }) : null);
}

/** Group heading inside a DropdownMenu. */
function MenuLabel({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "dc-dd__label"
  }, children);
}
/** Hairline between menu groups. */
function MenuSeparator() {
  return /*#__PURE__*/React.createElement("div", {
    className: "dc-dd__sep",
    role: "separator"
  });
}
Object.assign(__ds_scope, { DropdownMenu, MenuItem, MenuLabel, MenuSeparator });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/DropdownMenu.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Popover.jsx
try { (() => {
const CSS = `
.dc-pop{position:absolute;z-index:65;background:var(--surface-float);border-radius:var(--radius-3xl);box-shadow:var(--shadow-pop);padding:var(--space-7);animation:dc-float-in var(--dur-base) var(--ease-out)}
.dc-pop__head{display:flex;align-items:center;justify-content:space-between;gap:var(--space-6);margin-bottom:var(--space-6)}
.dc-pop__title{font:var(--type-section-label)}
.dc-pop__meta{margin-left:auto;font:var(--type-caption);color:var(--text-tertiary);font-variant-numeric:tabular-nums}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-popover-css")) {
  const el = document.createElement("style");
  el.id = "dc-popover-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Free-floating panel anchored near what it describes — variations, quick settings. */
function Popover({
  title,
  meta,
  onClose,
  children,
  width = 260,
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-pop ${className}`,
    style: {
      width,
      ...style
    },
    role: "dialog"
  }, title || meta || onClose ? /*#__PURE__*/React.createElement("div", {
    className: "dc-pop__head"
  }, title ? /*#__PURE__*/React.createElement("span", {
    className: "dc-pop__title"
  }, title) : null, meta ? /*#__PURE__*/React.createElement("span", {
    className: "dc-pop__meta"
  }, meta) : null, onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "cancel-01",
    label: "Close",
    size: "sm",
    onClick: onClose
  }) : null) : null, children);
}
Object.assign(__ds_scope, { Popover });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Popover.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Tooltip.jsx
try { (() => {
const CSS = `
.dc-tip{position:relative;display:inline-flex}
.dc-tip__bubble{position:absolute;z-index:60;display:flex;align-items:center;gap:var(--space-4);height:26px;padding:0 var(--space-5);background:var(--surface-inverse);color:var(--text-inverse);border-radius:var(--radius-sm);font:var(--type-label);white-space:nowrap;pointer-events:none;box-shadow:var(--shadow-inverse);animation:dc-tip-in var(--dur-fast) var(--ease-out)}
.dc-tip__bubble[data-side="bottom"]{top:calc(100% + 8px);left:50%;transform:translateX(-50%)}
.dc-tip__bubble[data-side="top"]{bottom:calc(100% + 8px);left:50%;transform:translateX(-50%)}
.dc-tip__bubble[data-side="right"]{left:calc(100% + 8px);top:50%;transform:translateY(-50%)}
.dc-tip__bubble[data-side="left"]{right:calc(100% + 8px);top:50%;transform:translateY(-50%)}
.dc-tip__kbd{color:var(--gray-500);font-family:var(--font-mono);font-size:var(--text-xs)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-tooltip-css")) {
  const el = document.createElement("style");
  el.id = "dc-tooltip-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Near-black hover label with an optional shortcut hint. Appears after a short delay. */
function Tooltip({
  label,
  kbd,
  side = "bottom",
  delay = 260,
  open,
  children,
  className = "",
  style
}) {
  const [hover, setHover] = React.useState(false);
  const timer = React.useRef(null);
  const show = open !== undefined ? open : hover;
  const enter = () => {
    timer.current = setTimeout(() => setHover(true), delay);
  };
  const leave = () => {
    clearTimeout(timer.current);
    setHover(false);
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return /*#__PURE__*/React.createElement("span", {
    className: `dc-tip ${className}`,
    style: style,
    onMouseEnter: enter,
    onMouseLeave: leave,
    onFocus: () => setHover(true),
    onBlur: leave
  }, children, show ? /*#__PURE__*/React.createElement("span", {
    className: "dc-tip__bubble",
    "data-side": side,
    role: "tooltip"
  }, label, kbd ? /*#__PURE__*/React.createElement("span", {
    className: "dc-tip__kbd"
  }, kbd) : null) : null);
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/panels/AssetCard.jsx
try { (() => {
const CSS = `
.dc-ac{position:relative;display:flex;flex-direction:column;gap:var(--space-5);border-radius:var(--radius-xl);background:var(--surface-sunken);overflow:hidden;cursor:pointer;transform:perspective(760px) rotateX(var(--mi-rx,0deg)) rotateY(var(--mi-ry,0deg)) scale(var(--mi-s,1));transition:box-shadow var(--dur-base) var(--ease-out),transform var(--dur-slow) var(--ease-spring-out),background-color var(--dur-fast) var(--ease-out)}
.dc-ac[data-tilting="true"]{transition:box-shadow var(--dur-base) var(--ease-out),transform var(--dur-instant) linear}
.dc-ac:hover{box-shadow:var(--shadow-float)}
.dc-ac:active{--mi-s:.985}
.dc-ac[data-selected="true"]{box-shadow:0 0 0 2px var(--blue-500)}
.dc-ac__media{position:relative;width:100%;aspect-ratio:var(--dc-ac-ratio,1/1);overflow:hidden;background:var(--surface-sunken)}
.dc-ac__media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform var(--dur-slow) var(--ease-out)}
.dc-ac:hover .dc-ac__media img{transform:scale(1.03)}
.dc-ac__top{position:absolute;top:var(--space-5);right:var(--space-5);display:flex;gap:var(--space-2);opacity:0;transform:translateY(-6px) scale(.9);transition:opacity var(--dur-base) var(--ease-out),transform var(--dur-slow) var(--ease-spring-out)}
.dc-ac:hover .dc-ac__top{opacity:1;transform:none}
.dc-ac__top button{transition:transform var(--dur-base) var(--ease-spring-out),background-color var(--dur-fast) var(--ease-out)}
.dc-ac__top button:hover{transform:scale(1.1)}
.dc-ac__top button:active{transform:scale(.9)}
.dc-ac__scrim button{transform:translateY(var(--mi-sy,4px));transition:opacity var(--dur-fast) var(--ease-out),transform var(--dur-slow) var(--ease-spring-out)}
.dc-ac:hover .dc-ac__scrim button{--mi-sy:0px}
.dc-ac__scrim{position:absolute;inset:auto 0 0 0;display:flex;align-items:center;gap:var(--space-5);padding:var(--space-9) var(--space-6) var(--space-5);color:var(--text-inverse);background:linear-gradient(to top,rgba(13,13,13,.52),rgba(13,13,13,0));opacity:0;transition:opacity var(--dur-base) var(--ease-out)}
.dc-ac:hover .dc-ac__scrim{opacity:1}
.dc-ac__scrim button{display:inline-flex;align-items:center;gap:var(--space-3);color:var(--text-inverse);font:var(--type-label);opacity:.92;transition:opacity var(--dur-fast) var(--ease-out)}
.dc-ac__scrim button:hover{opacity:1}
.dc-ac__spacer{flex:1 1 auto}
.dc-ac__meta{display:flex;align-items:center;gap:var(--space-4);padding:0 var(--space-6) var(--space-6)}
.dc-ac__name{font:var(--type-label);flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-ac__sub{font:var(--type-caption);color:var(--text-tertiary)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-assetcard-css")) {
  const el = document.createElement("style");
  el.id = "dc-assetcard-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Grid tile for a 3D object, material, style or background. Actions appear on rollover. */
function AssetCard({
  src,
  name,
  meta,
  ratio = "1/1",
  selected = false,
  onAdd,
  actions,
  onClick,
  tilt = true,
  children,
  className = "",
  style
}) {
  const t = __ds_scope.useTilt({
    disabled: !tilt,
    max: 4
  });
  return /*#__PURE__*/React.createElement("div", {
    ref: t.ref,
    className: `dc-ac ${className}`,
    "data-selected": selected ? "true" : undefined,
    style: {
      "--dc-ac-ratio": ratio,
      ...style
    },
    onClick: onClick,
    onPointerMove: t.onPointerMove,
    onPointerLeave: t.onPointerLeave
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-ac__media"
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name || ""
  }) : children, onAdd ? /*#__PURE__*/React.createElement("div", {
    className: "dc-ac__top"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Add to scene",
    onClick: e => {
      e.stopPropagation();
      onAdd();
    },
    style: {
      width: 30,
      height: 30,
      display: "grid",
      placeItems: "center",
      background: "var(--surface-float)",
      borderRadius: "var(--radius-sm)",
      boxShadow: "var(--shadow-float)",
      color: "var(--icon-default)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "plus-sign",
    size: "sm"
  }))) : null, actions ? /*#__PURE__*/React.createElement("div", {
    className: "dc-ac__scrim"
  }, actions) : null), name || meta ? /*#__PURE__*/React.createElement("div", {
    className: "dc-ac__meta"
  }, name ? /*#__PURE__*/React.createElement("span", {
    className: "dc-ac__name"
  }, name) : null, meta ? /*#__PURE__*/React.createElement("span", {
    className: "dc-ac__sub"
  }, meta) : null) : null);
}
Object.assign(__ds_scope, { AssetCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/panels/AssetCard.jsx", error: String((e && e.message) || e) }); }

// components/ai/VariationsGrid.jsx
try { (() => {
const CSS = `
.dc-vg{display:grid;grid-template-columns:repeat(var(--dc-vg-cols,2),1fr);gap:var(--space-4)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-variations-css")) {
  const el = document.createElement("style");
  el.id = "dc-variations-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Grid of generated alternatives; the chosen one carries the blue ring. */
function VariationsGrid({
  items = [],
  value,
  onSelect,
  columns = 2,
  ratio = "1/1",
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-vg ${className}`,
    style: {
      "--dc-vg-cols": columns,
      ...style
    }
  }, items.map((it, i) => {
    const id = it.id ?? i;
    return /*#__PURE__*/React.createElement(__ds_scope.AssetCard, {
      key: id,
      src: it.src,
      ratio: ratio,
      selected: value === id,
      onClick: () => onSelect && onSelect(id)
    });
  }));
}
Object.assign(__ds_scope, { VariationsGrid });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ai/VariationsGrid.jsx", error: String((e && e.message) || e) }); }

// components/panels/FloatingPanel.jsx
try { (() => {
const CSS = `
.dc-fp{display:flex;flex-direction:column;background:var(--surface-float);border-radius:var(--radius-3xl);box-shadow:var(--shadow-panel);overflow:hidden}
.dc-fp--flush{box-shadow:var(--shadow-float)}
.dc-fp__head{display:flex;align-items:center;gap:var(--space-5);padding:var(--space-7) var(--panel-pad) var(--space-5)}
.dc-fp__title{font:var(--type-panel-title);flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-fp__sub{padding:0 var(--panel-pad) var(--space-7);margin-top:calc(var(--space-2) * -1);font:var(--type-caption);color:var(--text-tertiary)}
.dc-fp__body{padding:0 var(--panel-pad) var(--panel-pad);overflow:auto;display:flex;flex-direction:column;gap:var(--space-6)}
.dc-fp__foot{padding:var(--space-6) var(--panel-pad);box-shadow:inset 0 1px 0 var(--border-subtle)}
.dc-fp__rule{height:1px;background:var(--border-subtle)}
.dc-ps{display:flex;flex-direction:column;gap:var(--space-6);padding:var(--space-7) 0}
.dc-ps+.dc-ps{box-shadow:inset 0 1px 0 var(--border-subtle)}
.dc-ps__head{display:flex;align-items:center;gap:var(--space-5)}
.dc-ps__title{font:var(--type-section-label);flex:1 1 auto}
.dc-ps__meta{font:var(--type-caption);color:var(--text-tertiary)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-panel-css")) {
  const el = document.createElement("style");
  el.id = "dc-panel-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** The floating white panel every piece of chrome is built from. */
function FloatingPanel({
  title,
  subtitle,
  action,
  onClose,
  header,
  footer,
  width,
  elevation = "panel",
  children,
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: `dc-fp${elevation === "float" ? " dc-fp--flush" : ""} ${className}`,
    style: {
      width,
      ...style
    }
  }, header || title ? /*#__PURE__*/React.createElement("header", {
    className: "dc-fp__head"
  }, header || /*#__PURE__*/React.createElement("span", {
    className: "dc-fp__title"
  }, title), action, onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "cancel-01",
    label: "Close panel",
    size: "sm",
    onClick: onClose
  }) : null) : null, subtitle ? /*#__PURE__*/React.createElement("div", {
    className: "dc-fp__sub"
  }, subtitle) : null, /*#__PURE__*/React.createElement("div", {
    className: "dc-fp__body"
  }, children), footer ? /*#__PURE__*/React.createElement("footer", {
    className: "dc-fp__foot"
  }, footer) : null);
}

/** Hairline-separated group inside a panel. */
function PanelSection({
  title,
  meta,
  action,
  children,
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-ps ${className}`,
    style: style
  }, title || action ? /*#__PURE__*/React.createElement("div", {
    className: "dc-ps__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dc-ps__title"
  }, title), meta ? /*#__PURE__*/React.createElement("span", {
    className: "dc-ps__meta"
  }, meta) : null, action) : null, children);
}
Object.assign(__ds_scope, { FloatingPanel, PanelSection });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/panels/FloatingPanel.jsx", error: String((e && e.message) || e) }); }

// components/panels/LayerRow.jsx
try { (() => {
const CSS = `
.dc-lr{position:relative;display:flex;align-items:center;gap:var(--space-5);width:100%;height:var(--row-h);padding:0 var(--space-4);border-radius:var(--radius-md);text-align:left;transition:background-color var(--dur-fast) var(--ease-out)}
.dc-lr::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:2px;border-radius:2px;background:var(--control-solid);opacity:0;transform:scaleY(.4);transition:opacity var(--dur-fast) var(--ease-out),transform var(--dur-base) var(--ease-spring-out)}
.dc-lr:hover::before{opacity:.2;transform:scaleY(1)}
.dc-lr[data-selected="true"]::before{opacity:1;transform:scaleY(1)}
.dc-lr:hover{background:var(--surface-hover)}
.dc-lr[data-selected="true"]{background:var(--surface-selected)}
.dc-lr__chip{display:grid;place-items:center;width:28px;height:28px;border-radius:var(--radius-sm);flex:0 0 auto;transition:background-color var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out),transform var(--dur-base) var(--ease-spring-out)}
.dc-lr[data-selected="true"] .dc-lr__chip{background:var(--gray-0);box-shadow:var(--shadow-pill);animation:dc-mi-pop var(--dur-slow) var(--ease-spring-out)}
.dc-lr__chip{transform:scale(var(--mi-cs,1))}
.dc-lr:hover .dc-lr__chip{--mi-cs:1.05}
.dc-lr__name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:var(--type-label);font-size:var(--text-md)}
.dc-lr[data-hidden="true"] .dc-lr__name{color:var(--text-tertiary)}
.dc-lr__tools{display:flex;align-items:center;gap:var(--space-1);opacity:0;transform:translateX(4px);transition:opacity var(--dur-fast) var(--ease-out),transform var(--dur-base) var(--ease-spring-out)}
.dc-lr:hover .dc-lr__tools,.dc-lr[data-selected="true"] .dc-lr__tools{opacity:1;transform:none}
.dc-lr__tool{display:grid;place-items:center;width:22px;height:22px;border-radius:var(--radius-xs);color:var(--icon-muted);transition:var(--transition-tint),transform var(--dur-base) var(--ease-spring-out)}
.dc-lr__tool:active{transform:scale(.86)}
.dc-lr__tool:hover{background:var(--gray-0);color:var(--icon-default)}
.dc-lr__tool[data-on="true"]{color:var(--icon-default)}
`;
if (typeof document !== "undefined" && !document.getElementById("dc-layerrow-css")) {
  const el = document.createElement("style");
  el.id = "dc-layerrow-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Scene-graph row: camera, light or object — with lock / visibility / enhance on rollover. */
function LayerRow({
  icon = "cube",
  name,
  selected = false,
  locked = false,
  hidden = false,
  onSelect,
  onToggleLock,
  onToggleVisible,
  onEnhance,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `dc-lr ${className}`,
    role: "button",
    tabIndex: 0,
    "data-selected": selected ? "true" : undefined,
    "data-hidden": hidden ? "true" : undefined,
    onClick: onSelect
  }, /*#__PURE__*/React.createElement("span", {
    className: "dc-lr__chip"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon
  })), /*#__PURE__*/React.createElement("span", {
    className: "dc-lr__name"
  }, name), /*#__PURE__*/React.createElement("span", {
    className: "dc-lr__tools"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dc-lr__tool",
    "data-on": locked ? "true" : undefined,
    "aria-label": locked ? "Unlock layer" : "Lock layer",
    onClick: e => {
      e.stopPropagation();
      onToggleLock && onToggleLock();
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: locked ? "square-lock-02" : "square-unlock-02",
    size: "sm"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dc-lr__tool",
    "data-on": !hidden ? "true" : undefined,
    "aria-label": hidden ? "Show layer" : "Hide layer",
    onClick: e => {
      e.stopPropagation();
      onToggleVisible && onToggleVisible();
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: hidden ? "view-off-slash" : "view",
    size: "sm"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dc-lr__tool",
    "aria-label": "Generate variations",
    onClick: e => {
      e.stopPropagation();
      onEnhance && onEnhance();
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "sparkles",
    size: "sm"
  }))));
}
Object.assign(__ds_scope, { LayerRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/panels/LayerRow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/AnimationScreen.jsx
try { (() => {
const NS = window.Ds3DandCanvasDesignSystem_39c2f2;
const {
  Toolbar,
  ToolbarDivider,
  IconButton,
  Button,
  Slider,
  FloatingPanel,
  PromptComposer,
  Tooltip,
  Icon,
  DropdownMenu,
  MenuItem
} = NS;
const anCss = `
.an-root{position:relative;flex:1 1 auto;background:var(--surface-canvas);overflow:hidden}
.an-canvas{position:absolute;inset:0 0 190px 0;display:grid;place-items:center}
.an-canvas img{max-height:520px;max-width:700px;width:auto;height:auto;object-fit:contain}
.an-timeline{position:absolute;left:0;right:0;bottom:0;height:190px;box-shadow:inset 0 1px 0 var(--border-subtle);background:var(--surface-app)}
.an-ticks{position:absolute;left:0;right:0;top:0;height:56px;display:flex}
.an-ticks span{flex:1;box-shadow:inset -1px 0 0 var(--border-subtle)}
.an-project{position:absolute;left:20px;top:20px;display:grid;place-items:center;width:var(--icon-btn-lg);height:var(--icon-btn-lg);background:var(--surface-float);border-radius:var(--radius-lg);box-shadow:var(--shadow-float)}
.an-project i{width:26px;height:26px;border-radius:var(--radius-full);background:radial-gradient(circle at 34% 30%,#FFB27A,#F4622A 62%,#DD4F18)}
.an-top{position:absolute;left:50%;top:20px;transform:translateX(-50%);z-index:15}
.an-status{display:inline-flex;align-items:center;gap:7px;height:var(--icon-btn-md);padding:0 12px;border-radius:var(--radius-md);font:var(--type-label);color:var(--text-primary);transition:var(--transition-tint)}
.an-status:hover{background:var(--surface-hover)}
.an-account{position:absolute;right:20px;top:20px;display:flex;align-items:center;gap:8px;padding:4px;background:var(--surface-float);border-radius:var(--radius-2xl);box-shadow:var(--shadow-float);z-index:15}
.an-account img{width:30px;height:30px;border-radius:var(--radius-full);object-fit:cover;box-shadow:0 0 0 2px var(--orange-500)}
.an-rail{position:absolute;left:20px;top:50%;transform:translateY(-50%);z-index:15}
.an-rail--right{left:auto;right:20px}
.an-inspector{position:absolute;right:82px;top:170px;width:var(--panel-w-sm);z-index:14}
.an-frames{position:absolute;left:50%;bottom:200px;transform:translateX(-50%);display:flex;gap:26px;padding:14px 16px;background:var(--surface-float);border-radius:var(--radius-3xl);box-shadow:var(--shadow-panel);z-index:16}
.an-col{display:flex;flex-direction:column;gap:10px}
.an-col__t{font:var(--type-label)}
.an-thumb{width:120px;height:120px;border-radius:var(--radius-lg);background:var(--surface-sunken);display:grid;place-items:center;overflow:hidden}
.an-thumb img{max-height:104px;max-width:104px;width:auto;height:auto;object-fit:contain}
.an-pad{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.an-composer{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);width:700px;z-index:17}
`;
if (!document.getElementById("an-css")) {
  const el = document.createElement("style");
  el.id = "an-css";
  el.textContent = anCss;
  document.head.appendChild(el);
}
function AnimationScreen({
  go,
  prompt,
  setPrompt,
  busy,
  onGenerate
}) {
  const [speed, setSpeed] = React.useState(46);
  const [dist, setDist] = React.useState(0);
  const [blur, setBlur] = React.useState(72);
  const [comp, setComp] = React.useState(0);
  const [trans, setTrans] = React.useState("morph");
  const [effect, setEffect] = React.useState("palette");
  return /*#__PURE__*/React.createElement("div", {
    className: "an-root"
  }, /*#__PURE__*/React.createElement("div", {
    className: "an-canvas"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/characters/character-run.png",
    alt: "Animated character"
  })), /*#__PURE__*/React.createElement("div", {
    className: "an-project"
  }, /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("div", {
    className: "an-top"
  }, /*#__PURE__*/React.createElement(Toolbar, null, /*#__PURE__*/React.createElement("button", {
    className: "an-status"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play-circle",
    size: "sm"
  }), "1080p"), /*#__PURE__*/React.createElement("button", {
    className: "an-status"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "crop",
    size: "sm"
  }), "2:3"), /*#__PURE__*/React.createElement("button", {
    className: "an-status"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock-01",
    size: "sm"
  }), "10s"), /*#__PURE__*/React.createElement("button", {
    className: "an-status"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "music-note-02",
    size: "sm"
  }), "On"), /*#__PURE__*/React.createElement(ToolbarDivider, null), /*#__PURE__*/React.createElement(Button, {
    variant: "neutral"
  }, "Export"))), /*#__PURE__*/React.createElement("div", {
    className: "an-account"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/avatars/a2.png",
    alt: "You"
  }), /*#__PURE__*/React.createElement(DropdownMenu, {
    label: "100%"
  }, /*#__PURE__*/React.createElement(MenuItem, {
    selected: true
  }, "100%"), /*#__PURE__*/React.createElement(MenuItem, null, "50%"), /*#__PURE__*/React.createElement(MenuItem, null, "Fit")), /*#__PURE__*/React.createElement(Button, {
    variant: "neutral",
    onClick: () => go("editor")
  }, "Share")), /*#__PURE__*/React.createElement("div", {
    className: "an-rail"
  }, /*#__PURE__*/React.createElement(Toolbar, {
    orientation: "vertical"
  }, /*#__PURE__*/React.createElement(Tooltip, {
    label: "Camera",
    side: "right"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "video-01",
    label: "Camera",
    selected: true
  })), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Reference image",
    side: "right"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "image-02",
    label: "Reference image"
  })), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Add element",
    side: "right"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "grid-view",
    label: "Add element"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "an-rail an-rail--right"
  }, /*#__PURE__*/React.createElement(Toolbar, {
    orientation: "vertical"
  }, /*#__PURE__*/React.createElement(Tooltip, {
    label: "Grid",
    side: "left"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "grid-table",
    label: "Grid"
  })), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Effects",
    side: "left"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "flash",
    label: "Effects"
  })), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Enhance",
    side: "left"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "magic-wand-01",
    label: "Enhance"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "an-inspector"
  }, /*#__PURE__*/React.createElement(FloatingPanel, {
    style: {
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement(Slider, {
    label: "Speed",
    value: speed,
    onChange: setSpeed
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Distortion",
    value: dist,
    onChange: setDist
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Motion Blur",
    value: blur,
    onChange: setBlur
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Color Compression",
    value: comp,
    onChange: setComp
  }))), /*#__PURE__*/React.createElement("div", {
    className: "an-frames"
  }, /*#__PURE__*/React.createElement("div", {
    className: "an-col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "an-col__t"
  }, "Start Frame"), /*#__PURE__*/React.createElement("div", {
    className: "an-thumb"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/characters/character-teal.png",
    alt: ""
  }))), /*#__PURE__*/React.createElement("div", {
    className: "an-col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "an-col__t"
  }, "Transitions"), /*#__PURE__*/React.createElement("div", {
    className: "an-pad"
  }, [["slide", "align-horizontal-center"], ["morph", "align-box-middle-center"], ["shrink", "arrow-shrink-02"], ["dissolve", "loading-03"]].map(([id, ic]) => /*#__PURE__*/React.createElement(IconButton, {
    key: id,
    icon: ic,
    label: id,
    size: "lg",
    variant: "neutral",
    selected: trans === id,
    onClick: () => setTrans(id)
  })))), /*#__PURE__*/React.createElement("div", {
    className: "an-col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "an-col__t"
  }, "Effects"), /*#__PURE__*/React.createElement("div", {
    className: "an-pad"
  }, [["blur", "blur"], ["sparkle", "star"], ["warp", "rotate-360"], ["palette", "colors"]].map(([id, ic]) => /*#__PURE__*/React.createElement(IconButton, {
    key: id,
    icon: ic,
    label: id,
    size: "lg",
    variant: "neutral",
    selected: effect === id,
    onClick: () => setEffect(id)
  })))), /*#__PURE__*/React.createElement("div", {
    className: "an-col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "an-col__t"
  }, "End Frame"), /*#__PURE__*/React.createElement("div", {
    className: "an-thumb"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/characters/character-run.png",
    alt: ""
  })))), /*#__PURE__*/React.createElement("div", {
    className: "an-timeline"
  }, /*#__PURE__*/React.createElement("div", {
    className: "an-ticks"
  }, Array.from({
    length: 9
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  })))), /*#__PURE__*/React.createElement("div", {
    className: "an-composer"
  }, /*#__PURE__*/React.createElement(PromptComposer, {
    value: prompt,
    onChange: setPrompt,
    onSubmit: onGenerate,
    busy: busy,
    placeholder: "Optionally describe your animation\u2026",
    elevation: "float"
  })));
}
Object.assign(window, {
  AnimationScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/AnimationScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/AppShell.jsx
try { (() => {
const NS = window.Ds3DandCanvasDesignSystem_39c2f2;
const {
  Sidebar,
  SidebarItem,
  SidebarLabel,
  SearchField,
  IconButton,
  Button,
  Icon,
  Tooltip
} = NS;
const shellCss = `
.st-window{position:relative;width:1440px;height:900px;background:var(--surface-app);border-radius:var(--radius-4xl);box-shadow:var(--shadow-window);overflow:hidden;display:flex;font-family:var(--font-sans)}
.st-side{width:256px;flex:0 0 auto;display:flex;flex-direction:column;padding:18px 14px;gap:6px;background:var(--surface-app);box-shadow:inset -1px 0 0 var(--border-subtle)}
.st-brand{display:flex;align-items:center;gap:10px;height:44px;padding:0 6px;margin-bottom:8px}
.st-brand__mark{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:var(--gray-900);color:#fff}
.st-brand__name{font-size:19px;font-weight:700;letter-spacing:-.03em}
.st-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;background:var(--surface-app)}
.st-top{display:flex;align-items:center;gap:12px;height:76px;padding:0 26px;flex:0 0 auto}
.st-top__nav{display:flex;gap:4px}
.st-top__grow{flex:1 1 auto}
.st-body{flex:1 1 auto;min-height:0;overflow:auto;padding:0 26px 26px;position:relative}
.st-h1{font:var(--type-heading);margin:6px 0 20px}
.st-headrow{display:flex;align-items:center;gap:12px;margin:6px 0 20px}
.st-headrow .st-h1{margin:0}
.st-avatar{width:34px;height:34px;border-radius:var(--radius-full);object-fit:cover;flex:0 0 auto}
.st-avatars{display:flex}
.st-avatars img{width:30px;height:30px;border-radius:var(--radius-full);object-fit:cover;box-shadow:0 0 0 2px var(--surface-float)}
.st-avatars img+img{margin-left:-8px}
.st-composer{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);width:660px;z-index:20}
`;
if (!document.getElementById("st-shell-css")) {
  const el = document.createElement("style");
  el.id = "st-shell-css";
  el.textContent = shellCss;
  document.head.appendChild(el);
}
function AppSidebar({
  route,
  go
}) {
  const [explore, setExplore] = React.useState(true);
  const [assets, setAssets] = React.useState(true);
  return /*#__PURE__*/React.createElement("aside", {
    className: "st-side"
  }, /*#__PURE__*/React.createElement("div", {
    className: "st-brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "st-brand__mark"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cube",
    size: "lg"
  })), /*#__PURE__*/React.createElement("span", {
    className: "st-brand__name"
  }, "3DandCanvas")), /*#__PURE__*/React.createElement(Sidebar, null, /*#__PURE__*/React.createElement(SidebarItem, {
    icon: "dashboard-browsing",
    label: "Explore",
    open: explore,
    onToggle: () => setExplore(!explore)
  }, /*#__PURE__*/React.createElement(SidebarItem, {
    indent: true,
    label: "Designs",
    active: route === "explore",
    onClick: () => go("explore")
  }), /*#__PURE__*/React.createElement(SidebarItem, {
    indent: true,
    label: "Animations",
    active: route === "animation",
    onClick: () => go("animation")
  })), /*#__PURE__*/React.createElement(SidebarItem, {
    icon: "cube",
    label: "Assets",
    count: 112,
    active: route === "library",
    open: assets,
    onToggle: () => setAssets(!assets)
  }, /*#__PURE__*/React.createElement(SidebarItem, {
    indent: true,
    label: "3D Objects",
    active: route === "library",
    onClick: () => go("library")
  }), /*#__PURE__*/React.createElement(SidebarItem, {
    indent: true,
    label: "Materials"
  })), /*#__PURE__*/React.createElement(SidebarItem, {
    icon: "favourite",
    label: "Likes"
  }), /*#__PURE__*/React.createElement(SidebarLabel, null, "My scenes"), /*#__PURE__*/React.createElement(SidebarItem, {
    icon: "cube",
    label: "My Scenes",
    onClick: () => go("editor")
  }), /*#__PURE__*/React.createElement(SidebarItem, {
    icon: "folder-add",
    label: "New Folder"
  }), /*#__PURE__*/React.createElement(SidebarItem, {
    icon: "folder-01",
    label: "Untitled Folder",
    iconColor: "var(--orange-500)"
  }), /*#__PURE__*/React.createElement(SidebarItem, {
    icon: "folder-01",
    label: "3D Icons",
    iconColor: "var(--green-500)"
  })));
}

/** Browser-style top bar shared by Explore and Library. */
function TopBar({
  placeholder,
  actions
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "st-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "st-top__nav"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrow-left-02",
    label: "Back",
    variant: "quiet"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrow-right-02",
    label: "Forward",
    variant: "neutral"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 360
    }
  }, /*#__PURE__*/React.createElement(SearchField, {
    placeholder: placeholder
  })), /*#__PURE__*/React.createElement("span", {
    className: "st-top__grow"
  }), actions);
}
Object.assign(window, {
  AppSidebar,
  TopBar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/EditorScreen.jsx
try { (() => {
const NS = window.Ds3DandCanvasDesignSystem_39c2f2;
const {
  FloatingPanel,
  PanelSection,
  LayerRow,
  AssetCard,
  Toolbar,
  ToolbarDivider,
  IconButton,
  Button,
  SegmentedControl,
  SearchField,
  Slider,
  Switch,
  NumberField,
  ColorField,
  Accordion,
  AccordionItem,
  Tooltip,
  Popover,
  VariationsGrid,
  PromptComposer,
  CanvasLoader,
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  Icon
} = NS;
const edCss = `
.ed-root{position:relative;flex:1 1 auto;background:var(--surface-canvas);overflow:hidden}
.ed-canvas{position:absolute;inset:0;display:grid;place-items:center}
.ed-canvas img{max-height:560px;max-width:700px;width:auto;height:auto;object-fit:contain;user-select:none}
.ed-left{position:absolute;left:20px;top:20px;bottom:20px;width:var(--panel-w-lg);display:flex}
.ed-right{position:absolute;right:20px;top:20px;bottom:20px;width:var(--panel-w-md);display:flex}
.ed-top{position:absolute;left:50%;top:20px;transform:translateX(-50%);z-index:15}
.ed-composer{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);width:620px;z-index:15}
.ed-loader{position:absolute;left:50%;top:26px;transform:translateX(-50%);z-index:30}
.ed-vars{position:absolute;left:calc(var(--panel-w-lg) + 34px);top:300px;z-index:25}
.ed-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ed-title{display:flex;align-items:center;gap:4px}
.ed-title__t{font:var(--type-panel-title)}
.ed-lens{display:flex;flex-direction:column;gap:8px}
.ed-lensrow{display:flex;align-items:center;gap:8px}
.ed-lensrow .ed-lenschip{flex:1 1 auto;display:flex;align-items:center;gap:8px;height:var(--control-h-md);padding:0 10px;border-radius:var(--radius-md);background:var(--surface-sunken);font:var(--type-label);transition:var(--transition-tint)}
.ed-lensrow .ed-lenschip:hover{background:var(--surface-hover)}
.ed-strip{display:flex;gap:2px;border-radius:var(--radius-sm);overflow:hidden}
.ed-strip img{width:20%;height:56px;object-fit:cover;background:var(--surface-sunken)}
.ed-strip img:first-child,.ed-strip img:last-child{filter:blur(2px);opacity:.8}
.ed-zoom{display:flex;align-items:center;gap:2px}
`;
if (!document.getElementById("ed-css")) {
  const el = document.createElement("style");
  el.id = "ed-css";
  el.textContent = edCss;
  document.head.appendChild(el);
}
const LAYERS = [["Camera 1", "camera-lens"], ["Dome Light", "sun-01"], ["Key Light", "bulb"], ["Area Light", "flash"], ["Object 2", "cube"], ["Background 2", "cube"], ["Character", "cube"], ["Background 1", "cube"]];
const CHARACTERS = {
  1: "../../assets/characters/character-teal.png",
  2: "../../assets/characters/character-green.png",
  3: "../../assets/characters/character-teal.png",
  4: "../../assets/characters/character-green.png"
};
function EditorScreen({
  go,
  prompt,
  setPrompt,
  busy,
  onGenerate
}) {
  const [tool, setTool] = React.useState("select");
  const [pane, setPane] = React.useState("Scene");
  const [tab, setTab] = React.useState("Design");
  const [sel, setSel] = React.useState("Object 2");
  const [hidden, setHidden] = React.useState({});
  const [locked, setLocked] = React.useState({
    "Object 2": true
  });
  const [material, setMaterial] = React.useState(1);
  const [variant, setVariant] = React.useState(1);
  const [vars, setVars] = React.useState(false);
  const [cam, setCam] = React.useState("Isometric");
  const [dist, setDist] = React.useState(28);
  const [blur, setBlur] = React.useState(true);
  const [loop, setLoop] = React.useState("Short");
  const [bg, setBg] = React.useState("#F4F4F4");
  return /*#__PURE__*/React.createElement("div", {
    className: "ed-root",
    style: {
      background: bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ed-canvas"
  }, /*#__PURE__*/React.createElement("img", {
    src: CHARACTERS[variant],
    alt: "3D character"
  })), /*#__PURE__*/React.createElement("div", {
    className: "ed-top"
  }, /*#__PURE__*/React.createElement(Toolbar, null, [["select", "cursor-01", "Select"], ["pan", "move", "Pan"], ["comment", "comment-01", "Comment"], ["crop", "crop", "Crop"], ["play", "play", "Preview"]].map(([id, ic, lb]) => /*#__PURE__*/React.createElement(Tooltip, {
    key: id,
    label: lb
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: ic,
    label: lb,
    selected: tool === id,
    onClick: () => setTool(id)
  }))), /*#__PURE__*/React.createElement(ToolbarDivider, null), /*#__PURE__*/React.createElement(DropdownMenu, {
    label: "100%",
    sunken: true
  }, /*#__PURE__*/React.createElement(MenuItem, {
    selected: true
  }, "100%"), /*#__PURE__*/React.createElement(MenuItem, null, "200%"), /*#__PURE__*/React.createElement(MenuItem, null, "Zoom to fit")), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Undo",
    kbd: "\u2318Z"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrow-left-02",
    label: "Undo"
  })), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Redo",
    kbd: "\u21E7\u2318Z"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrow-right-02",
    label: "Redo"
  })), /*#__PURE__*/React.createElement(ToolbarDivider, null), /*#__PURE__*/React.createElement(Button, {
    variant: "neutral",
    onClick: () => go("animation")
  }, "Export"))), /*#__PURE__*/React.createElement("div", {
    className: "ed-left"
  }, /*#__PURE__*/React.createElement(FloatingPanel, {
    style: {
      width: "100%"
    },
    header: /*#__PURE__*/React.createElement(DropdownMenu, {
      align: "start",
      trigger: /*#__PURE__*/React.createElement("span", {
        className: "ed-title"
      }, /*#__PURE__*/React.createElement("span", {
        className: "ed-title__t"
      }, "3D Boy Character"), /*#__PURE__*/React.createElement(Icon, {
        name: "arrow-down-01",
        size: "sm",
        color: "var(--icon-muted)"
      }))
    }, /*#__PURE__*/React.createElement(MenuItem, {
      icon: "edit-02"
    }, "Rename scene"), /*#__PURE__*/React.createElement(MenuItem, {
      icon: "copy-01"
    }, "Duplicate"), /*#__PURE__*/React.createElement(MenuSeparator, null), /*#__PURE__*/React.createElement(MenuItem, {
      icon: "delete-02",
      danger: true
    }, "Delete scene")),
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "sidebar-left-01",
      label: "Collapse panel",
      size: "sm"
    }),
    subtitle: "3D Design Project",
    footer: /*#__PURE__*/React.createElement(SearchField, {
      placeholder: "Search..."
    })
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    full: true,
    options: ["Scene", "Assets"],
    value: pane,
    onChange: setPane
  }), pane === "Scene" ? /*#__PURE__*/React.createElement("div", null, LAYERS.map(([n, ic]) => /*#__PURE__*/React.createElement(LayerRow, {
    key: n,
    icon: ic,
    name: n,
    selected: sel === n,
    hidden: !!hidden[n],
    locked: !!locked[n],
    onSelect: () => setSel(n),
    onToggleLock: () => setLocked({
      ...locked,
      [n]: !locked[n]
    }),
    onToggleVisible: () => setHidden({
      ...hidden,
      [n]: !hidden[n]
    }),
    onEnhance: () => {
      setSel(n);
      setVars(true);
    }
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "ed-grid2"
  }, ["penguin", "turtle", "pig", "dino"].map(o => /*#__PURE__*/React.createElement(AssetCard, {
    key: o,
    src: `../../assets/objects/${o}.png`,
    onAdd: () => {}
  }))))), vars ? /*#__PURE__*/React.createElement("div", {
    className: "ed-vars"
  }, /*#__PURE__*/React.createElement(Popover, {
    title: "Variations",
    meta: `${variant} of 4`,
    onClose: () => setVars(false),
    width: 264,
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(VariationsGrid, {
    items: [1, 2, 3, 4].map(n => ({
      id: n,
      src: `../../assets/variations/v${n}.png`
    })),
    value: variant,
    onSelect: setVariant
  }))) : null, /*#__PURE__*/React.createElement("div", {
    className: "ed-right"
  }, /*#__PURE__*/React.createElement(FloatingPanel, {
    style: {
      width: "100%"
    },
    header: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: "st-avatars"
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/avatars/a1.png",
      alt: ""
    }), /*#__PURE__*/React.createElement("img", {
      src: "../../assets/avatars/a3.png",
      alt: ""
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: "1 1 auto"
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "neutral"
    }, "Share"))
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    full: true,
    options: ["Design", "Animation"],
    value: tab,
    onChange: setTab
  }), tab === "Design" ? /*#__PURE__*/React.createElement(Accordion, null, /*#__PURE__*/React.createElement(AccordionItem, {
    title: "Materials",
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "plus-sign",
      label: "Add material",
      size: "sm"
    })
  }, /*#__PURE__*/React.createElement("div", {
    className: "ed-grid2"
  }, [1, 2, 3, 4].map(m => /*#__PURE__*/React.createElement(AssetCard, {
    key: m,
    src: `../../assets/materials/m${m}.png`,
    selected: material === m,
    onClick: () => setMaterial(m)
  })))), /*#__PURE__*/React.createElement(AccordionItem, {
    title: "Styles",
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "plus-sign",
      label: "Add style",
      size: "sm"
    })
  }, /*#__PURE__*/React.createElement("div", {
    className: "ed-grid2"
  }, /*#__PURE__*/React.createElement(AssetCard, {
    src: "../../assets/styles/s1.jpg",
    ratio: "4/3"
  }), /*#__PURE__*/React.createElement(AssetCard, {
    src: "../../assets/styles/s2.jpg",
    ratio: "4/3"
  }))), /*#__PURE__*/React.createElement(AccordionItem, {
    title: "Backgrounds",
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "plus-sign",
      label: "Add background",
      size: "sm"
    })
  }, /*#__PURE__*/React.createElement(ColorField, {
    value: bg,
    opacity: 100,
    onChange: setBg
  })), /*#__PURE__*/React.createElement(AccordionItem, {
    title: "Camera",
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "plus-sign",
      label: "Add camera",
      size: "sm"
    })
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    full: true,
    options: ["Isometric", "Perspective"],
    value: cam,
    onChange: setCam
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-end",
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Slider, {
    label: "Distortion",
    value: dist,
    onChange: setDist,
    style: {
      flex: "1 1 auto"
    }
  }), /*#__PURE__*/React.createElement(NumberField, {
    value: (dist / 100).toFixed(3),
    width: 44
  })))) : /*#__PURE__*/React.createElement(Accordion, null, /*#__PURE__*/React.createElement(AccordionItem, {
    title: "Motion Blur"
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: blur,
    onChange: setBlur,
    label: "Enabled"
  })), /*#__PURE__*/React.createElement(AccordionItem, {
    title: "Loop",
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "play",
      label: "Play loop",
      size: "sm"
    })
  }, /*#__PURE__*/React.createElement("div", {
    className: "ed-strip"
  }, [1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement("img", {
    key: i,
    src: "../../assets/characters/character-green.png",
    alt: ""
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    options: ["Short", "Long"],
    value: loop,
    onChange: setLoop,
    style: {
      flex: "1 1 auto"
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "neutral",
    size: "md",
    icon: "clock-01"
  }, "8s"))), /*#__PURE__*/React.createElement(AccordionItem, {
    title: "Effects",
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "plus-sign",
      label: "Add effect",
      size: "sm"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8
    }
  }, ["monolith", "architecture", "organic", "car", "device", "mushroom"].map(n => /*#__PURE__*/React.createElement(AssetCard, {
    key: n,
    src: `../../assets/imagery/${n}.jpg`
  })))), /*#__PURE__*/React.createElement(AccordionItem, {
    title: "Lens",
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "plus-sign",
      label: "Add lens",
      size: "sm"
    })
  }, /*#__PURE__*/React.createElement("div", {
    className: "ed-lens"
  }, [["Wide-Angle Lens", "camera-lens", "view"], ["Zoom out", "zoom-out-area", "minus-sign"], ["Rotate around", "rotate-360", "minus-sign"]].map(([n, ic, act]) => /*#__PURE__*/React.createElement("div", {
    className: "ed-lensrow",
    key: n
  }, /*#__PURE__*/React.createElement("span", {
    className: "ed-lenschip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: "sm"
  }), n, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "1 1 auto"
    }
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-down-01",
    size: "sm",
    color: "var(--icon-muted)"
  })), /*#__PURE__*/React.createElement(IconButton, {
    icon: act,
    label: "Toggle",
    size: "sm"
  })))))))), busy ? /*#__PURE__*/React.createElement("div", {
    className: "ed-loader"
  }, /*#__PURE__*/React.createElement(CanvasLoader, {
    title: "Generating variations",
    detail: "Brainwave 2.5"
  })) : null, /*#__PURE__*/React.createElement("div", {
    className: "ed-composer"
  }, /*#__PURE__*/React.createElement(PromptComposer, {
    value: prompt,
    onChange: setPrompt,
    onSubmit: onGenerate,
    busy: busy,
    preset: "Inspiration",
    model: "Brainwave 2.5",
    onAttach: () => {},
    onVoice: () => {}
  })));
}
Object.assign(window, {
  EditorScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/EditorScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/ExploreScreen.jsx
try { (() => {
const {
  AssetCard,
  Button,
  IconButton,
  Icon,
  PromptComposer,
  Tooltip
} = window.Ds3DandCanvasDesignSystem_39c2f2;
const exploreCss = `
.ex-cats{display:flex;gap:12px;overflow:hidden;padding:2px 0 18px}
.ex-cat{display:flex;align-items:center;gap:12px;flex:0 0 auto;width:216px;padding:10px;border-radius:var(--radius-xl);background:var(--surface-float);box-shadow:var(--shadow-float);transition:box-shadow var(--dur-base) var(--ease-out),transform var(--dur-base) var(--ease-out);cursor:pointer}
.ex-cat:hover{box-shadow:var(--shadow-pop);transform:translateY(-2px)}
.ex-cat[data-on="true"]{box-shadow:var(--shadow-pop)}
.ex-cat img{width:54px;height:54px;border-radius:var(--radius-lg);object-fit:cover;flex:0 0 auto}
.ex-cat__t{font:var(--type-label);font-size:var(--text-md)}
.ex-cat__s{font:var(--type-caption);color:var(--text-tertiary)}
.ex-masonry{display:flex;gap:14px;padding-bottom:120px;align-items:flex-start}
.ex-mcol{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:14px}
`;
if (!document.getElementById("ex-css")) {
  const el = document.createElement("style");
  el.id = "ex-css";
  el.textContent = exploreCss;
  document.head.appendChild(el);
}
const CATS = [["Product Design", "Sleek, abstract objects", "../../assets/imagery/monolith.jpg"], ["Backgrounds", "Dreamy, scenic vibes", "../../assets/imagery/architecture.jpg"], ["Animated", "Minimalist, soft", "../../assets/imagery/mushroom.jpg"], ["3D Icons", "Clean, rounded icons", "../../assets/objects/turtle.png"], ["Materials", "Matte, glossy, clay", "../../assets/imagery/organic.jpg"]];
const TILES = [["../../assets/imagery/monolith.jpg", "4/5", "Tran Mau Tri Tam"], ["../../assets/imagery/mushroom.jpg", "3/2", "Studio Nord"], ["../../assets/imagery/architecture.jpg", "3/4", "Amanati"], ["../../assets/imagery/device.jpg", "1/1", "Kenji O."], ["../../assets/imagery/car.jpg", "16/9", "Lena Ruiz"], ["../../assets/imagery/organic.jpg", "3/2", "Studio Nord"]];
function ExploreScreen({
  go,
  prompt,
  setPrompt,
  onGenerate,
  busy
}) {
  const [cat, setCat] = React.useState("Backgrounds");
  return /*#__PURE__*/React.createElement("div", {
    className: "st-main"
  }, /*#__PURE__*/React.createElement(TopBar, {
    placeholder: "Search designs...",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
      icon: "filter",
      label: "Filter",
      variant: "quiet"
    }), /*#__PURE__*/React.createElement(Tooltip, {
      label: "Activity"
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "flash",
      label: "Activity",
      variant: "quiet",
      badge: true
    })), /*#__PURE__*/React.createElement("img", {
      className: "st-avatar",
      src: "../../assets/avatars/a1.png",
      alt: "You"
    }))
  }), /*#__PURE__*/React.createElement("div", {
    className: "st-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ex-cats"
  }, CATS.map(([t, s, img]) => /*#__PURE__*/React.createElement("div", {
    className: "ex-cat",
    key: t,
    "data-on": cat === t ? "true" : undefined,
    onClick: () => setCat(t)
  }, /*#__PURE__*/React.createElement("img", {
    src: img,
    alt: ""
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "ex-cat__t"
  }, t), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "ex-cat__s"
  }, s))))), /*#__PURE__*/React.createElement("div", {
    className: "ex-masonry"
  }, [0, 1, 2].map(col => /*#__PURE__*/React.createElement("div", {
    className: "ex-mcol",
    key: col
  }, TILES.filter((_, i) => i % 3 === col).map(([src, ratio, author], i) => /*#__PURE__*/React.createElement(AssetCard, {
    key: i,
    src: src,
    ratio: ratio,
    onClick: () => go("editor"),
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-label)"
      }
    }, author), /*#__PURE__*/React.createElement("span", {
      className: "dc-ac__spacer"
    }), /*#__PURE__*/React.createElement("button", {
      "aria-label": "Add text"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "text-font",
      size: "sm"
    })), /*#__PURE__*/React.createElement("button", {
      "aria-label": "Remix"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: "sm"
    })), /*#__PURE__*/React.createElement("button", {
      "aria-label": "Like"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "favourite",
      size: "sm"
    })))
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "st-composer"
  }, /*#__PURE__*/React.createElement(PromptComposer, {
    value: prompt,
    onChange: setPrompt,
    onSubmit: onGenerate,
    busy: busy,
    preset: "Inspiration",
    model: "Brainwave 2.5",
    onAttach: () => {},
    onVoice: () => {}
  })));
}
Object.assign(window, {
  ExploreScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/ExploreScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/studio/LibraryScreen.jsx
try { (() => {
const {
  AssetCard,
  Button,
  IconButton,
  Icon,
  Skeleton,
  Tooltip,
  SearchField
} = window.Ds3DandCanvasDesignSystem_39c2f2;
const libCss = `
.lb-filters{display:flex;gap:8px;margin-left:auto}
.lb-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding-bottom:26px}
.lb-blur{filter:blur(6px);opacity:.55;pointer-events:none}
`;
if (!document.getElementById("lb-css")) {
  const el = document.createElement("style");
  el.id = "lb-css";
  el.textContent = libCss;
  document.head.appendChild(el);
}
const OBJECTS = ["penguin", "turtle", "cow", "octopus", "cat", "snail", "pig", "dino"];
const NAMES = {
  penguin: "Penguin",
  turtle: "Turtle",
  cow: "Cow",
  octopus: "Octopus",
  cat: "Cat",
  snail: "Snail",
  pig: "Pig",
  dino: "Dino"
};
function LibraryScreen({
  go
}) {
  const [filter, setFilter] = React.useState("All Objects");
  const [added, setAdded] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "st-main"
  }, /*#__PURE__*/React.createElement(TopBar, {
    placeholder: "Search files...",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Tooltip, {
      label: "Activity"
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "flash",
      label: "Activity",
      variant: "quiet",
      badge: true
    })), /*#__PURE__*/React.createElement(Button, {
      variant: "neutral",
      onClick: () => go("editor")
    }, "Create"), /*#__PURE__*/React.createElement("img", {
      className: "st-avatar",
      src: "../../assets/avatars/a1.png",
      alt: "You"
    }))
  }), /*#__PURE__*/React.createElement("div", {
    className: "st-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "st-headrow"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "st-h1"
  }, "3D Objects"), /*#__PURE__*/React.createElement("div", {
    className: "lb-filters"
  }, ["All Objects", "Built-in", "Yours", "Shared"].map(f => /*#__PURE__*/React.createElement(Button, {
    key: f,
    size: "sm",
    pill: true,
    variant: filter === f ? "outline" : "quiet",
    onClick: () => setFilter(f)
  }, f)))), /*#__PURE__*/React.createElement("div", {
    className: "lb-grid"
  }, OBJECTS.map(o => /*#__PURE__*/React.createElement(AssetCard, {
    key: o,
    src: `../../assets/objects/${o}.png`,
    onAdd: () => {
      setAdded(o);
      go("editor");
    },
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      "aria-label": "Download"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "download-04",
      size: "sm"
    })), /*#__PURE__*/React.createElement("span", {
      className: "dc-ac__spacer"
    }), /*#__PURE__*/React.createElement("button", null, /*#__PURE__*/React.createElement(Icon, {
      name: "share-08",
      size: "sm"
    }), "Share"))
  })), [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
    key: `s${i}`
  }, /*#__PURE__*/React.createElement(Skeleton, {
    variant: "thumb"
  }))))));
}
Object.assign(window, {
  LibraryScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/studio/LibraryScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Toolbar = __ds_scope.Toolbar;

__ds_ns.ToolbarDivider = __ds_scope.ToolbarDivider;

__ds_ns.ChatMessage = __ds_scope.ChatMessage;

__ds_ns.PromptComposer = __ds_scope.PromptComposer;

__ds_ns.VariationsGrid = __ds_scope.VariationsGrid;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.CanvasLoader = __ds_scope.CanvasLoader;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.ProgressRing = __ds_scope.ProgressRing;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.ColorField = __ds_scope.ColorField;

__ds_ns.NumberField = __ds_scope.NumberField;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Slider = __ds_scope.Slider;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.Accordion = __ds_scope.Accordion;

__ds_ns.AccordionItem = __ds_scope.AccordionItem;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.SidebarLabel = __ds_scope.SidebarLabel;

__ds_ns.SidebarItem = __ds_scope.SidebarItem;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.DropdownMenu = __ds_scope.DropdownMenu;

__ds_ns.MenuItem = __ds_scope.MenuItem;

__ds_ns.MenuLabel = __ds_scope.MenuLabel;

__ds_ns.MenuSeparator = __ds_scope.MenuSeparator;

__ds_ns.Popover = __ds_scope.Popover;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.AssetCard = __ds_scope.AssetCard;

__ds_ns.FloatingPanel = __ds_scope.FloatingPanel;

__ds_ns.PanelSection = __ds_scope.PanelSection;

__ds_ns.LayerRow = __ds_scope.LayerRow;

})();
