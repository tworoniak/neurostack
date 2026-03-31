import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import type { MemoryDirectory, WorklogEntry } from '../../types/memory';
import { parseWorklog } from '../../lib/parseWorklog';
import { parseDecisions } from '../../lib/parseDecisions';
import { parseActiveWork } from '../../lib/parseActiveWork';
import {
  activityByDay,
  projectActivity,
  decisionsPerWeek,
} from '../../lib/parseWorklogStats';

interface Props {
  directory: MemoryDirectory | null;
}

const ACCENT = '#4EFFC4';
const AMBER = '#FFB547';
const MUTED = '#3A3A4A';
const SURFACE = '#18181E';
const BORDER = 'rgba(255,255,255,0.06)';
const TEXT_SEC = '#9090A0';
const TEXT_MUT = '#606070';

type DayRange = 30 | 60 | 90;

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: '20px 24px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.1em',
        color: TEXT_MUT,
        textTransform: 'uppercase',
        marginBottom: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Overview({ directory }: Props) {
  const [dayRange, setDayRange] = useState<DayRange>(30);
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);

  const worklogContent = directory?.files.get('worklog.md')?.content ?? '';
  const decisionsContent = directory?.files.get('decisions.md')?.content ?? '';
  const activeWorkContent =
    directory?.files.get('active-work.md')?.content ?? '';

  const worklogs = useMemo(
    () => parseWorklog(worklogContent),
    [worklogContent],
  );
  const decisions = useMemo(
    () => parseDecisions(decisionsContent),
    [decisionsContent],
  );
  const agents = useMemo(
    () => parseActiveWork(activeWorkContent),
    [activeWorkContent],
  );

  const heatmapData = useMemo(() => activityByDay(worklogs), [worklogs]);
  const worklogByDate = useMemo(() => {
    const map = new Map<string, WorklogEntry[]>();
    for (const w of worklogs) {
      const list = map.get(w.date) ?? [];
      list.push(w);
      map.set(w.date, list);
    }
    return map;
  }, [worklogs]);
  const projectData = useMemo(
    () => projectActivity(worklogs, dayRange),
    [worklogs, dayRange],
  );
  const velocityData = useMemo(
    () => decisionsPerWeek(decisions, 12),
    [decisions],
  );

  const uniqueProjects = useMemo(
    () => new Set(worklogs.map((w) => w.project)).size,
    [worklogs],
  );

  const agentStatusData = useMemo(() => {
    const counts = { working: 0, blocked: 0, done: 0 };
    for (const a of agents) counts[a.status]++;
    return [
      { name: 'Working', value: counts.working, color: ACCENT },
      { name: 'Blocked', value: counts.blocked, color: AMBER },
      { name: 'Done', value: counts.done, color: MUTED },
    ].filter((d) => d.value > 0);
  }, [agents]);

  // Heatmap: 53 columns × 7 rows (GitHub-style: column = week, row = day of week)
  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);
  // Pad start so first day lands on correct row (0=Sun … 6=Sat)
  const heatmapStartPad =
    heatmapData.length > 0
      ? new Date(heatmapData[0].date + 'T00:00:00').getDay()
      : 0;

  if (!directory) return null;

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '0.04em',
            margin: 0,
          }}
        >
          Overview
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXT_SEC }}>
          Activity across all memory files
        </p>
      </div>

      {/* KPI strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: 'Total sessions', value: worklogs.length },
          { label: 'Active projects', value: uniqueProjects },
          { label: 'Decisions logged', value: decisions.length },
          { label: 'Files loaded', value: directory.files.size },
        ].map(({ label, value }) => (
          <Card key={label} style={{ padding: '16px 20px' }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: ACCENT,
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: TEXT_SEC,
                marginTop: 6,
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </div>
          </Card>
        ))}
      </div>

      {/* Activity heatmap */}
      <Card style={{ marginBottom: 20 }}>
        <SectionLabel>Activity — last 365 days</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(53, 1fr)',
            gridTemplateRows: 'repeat(7, 10px)',
            gridAutoFlow: 'column',
            gap: 2,
            width: '100%',
          }}
        >
          {Array.from({ length: heatmapStartPad }, (_, i) => (
            <div key={`pad-${i}`} style={{ background: 'transparent' }} />
          ))}
          {heatmapData.map(({ date, count }) => {
            const opacity = count === 0 ? 0.06 : 0.2 + (count / maxCount) * 0.8;
            const isSelected = selectedHeatmapDate === date;
            return (
              <button
                key={date}
                onClick={() => setSelectedHeatmapDate(d => d === date ? null : date)}
                title={`${date}: ${count} session${count !== 1 ? 's' : ''}`}
                style={{
                  background: count === 0 ? `rgba(255,255,255,${opacity})` : `rgba(78,255,196,${opacity})`,
                  borderRadius: 2,
                  border: isSelected ? '1px solid var(--accent)' : 'none',
                  padding: 0,
                  cursor: count > 0 ? 'pointer' : 'default',
                  outline: 'none',
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 10, color: TEXT_MUT }}>Less</span>
          {[0.06, 0.3, 0.55, 0.75, 1].map((op, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background:
                  i === 0 ? `rgba(255,255,255,0.06)` : `rgba(78,255,196,${op})`,
              }}
            />
          ))}
          <span style={{ fontSize: 10, color: TEXT_MUT }}>More</span>
        </div>

        {selectedHeatmapDate && (() => {
          const entries = worklogByDate.get(selectedHeatmapDate) ?? [];
          return (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: entries.length > 0 ? 8 : 0 }}>
                <span style={{ fontSize: 11, color: ACCENT, fontFamily: 'var(--font-mono)', flex: 1 }}>
                  {selectedHeatmapDate} — {entries.length === 0 ? 'no sessions logged' : `${entries.length} session${entries.length !== 1 ? 's' : ''}`}
                </span>
                <button
                  onClick={() => setSelectedHeatmapDate(null)}
                  style={{ background: 'none', border: 'none', color: TEXT_MUT, fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: 0 }}
                >
                  ×
                </button>
              </div>
              {entries.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: ACCENT, fontFamily: 'var(--font-mono)', flexShrink: 0, opacity: 0.7 }}>[{e.project}]</span>
                  <span style={{ color: TEXT_SEC }}>{e.summary}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </Card>

      {/* Bar chart + Donut */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Project activity bar chart */}
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <SectionLabel style={{ margin: 0 }}>Project activity</SectionLabel>
            <div style={{ display: 'flex', gap: 4 }}>
              {([30, 60, 90] as DayRange[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDayRange(d)}
                  style={{
                    padding: '3px 10px',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    background:
                      dayRange === d ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${dayRange === d ? 'rgba(78,255,196,0.25)' : BORDER}`,
                    borderRadius: 4,
                    color: dayRange === d ? ACCENT : TEXT_MUT,
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {projectData.length === 0 ? (
            <div
              style={{
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: TEXT_MUT,
                fontSize: 12,
              }}
            >
              No sessions in last {dayRange} days
            </div>
          ) : (
            <ResponsiveContainer
              width='100%'
              height={Math.max(180, projectData.length * 36)}
            >
              <BarChart
                data={projectData}
                layout='vertical'
                margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
              >
                <XAxis
                  type='number'
                  tick={{ fill: TEXT_MUT, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type='category'
                  dataKey='project'
                  tick={{ fill: TEXT_SEC, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: '#111115',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                  labelStyle={{ color: TEXT_SEC }}
                  itemStyle={{ color: ACCENT }}
                  formatter={(v: unknown) => {
                    const n = Number(v);
                    return [`${n} session${n !== 1 ? 's' : ''}`, ''];
                  }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar
                  dataKey='sessions'
                  fill={ACCENT}
                  radius={[0, 3, 3, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Agent status donut */}
        <Card>
          <SectionLabel>Agent status</SectionLabel>
          {agentStatusData.length === 0 ? (
            <div
              style={{
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: TEXT_MUT,
                fontSize: 12,
              }}
            >
              No agents in active-work.md
            </div>
          ) : (
            <>
              <ResponsiveContainer width='100%' height={160}>
                <PieChart>
                  <Pie
                    data={agentStatusData}
                    cx='50%'
                    cy='50%'
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey='value'
                  >
                    {agentStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#111115',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    itemStyle={{ color: TEXT_SEC }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {agentStatusData.map((d) => (
                  <div
                    key={d.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: d.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: TEXT_SEC, flex: 1 }}>{d.name}</span>
                    <span
                      style={{
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Decision velocity */}
      <Card>
        <SectionLabel>Decision velocity — last 12 weeks</SectionLabel>
        {decisions.length === 0 ? (
          <div
            style={{
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: TEXT_MUT,
              fontSize: 12,
            }}
          >
            No decisions in decisions.md
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={140}>
            <LineChart
              data={velocityData}
              margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
            >
              <XAxis
                dataKey='week'
                tick={{ fill: TEXT_MUT, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: TEXT_MUT, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  background: '#111115',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                  fontSize: 11,
                }}
                labelStyle={{ color: TEXT_SEC }}
                itemStyle={{ color: ACCENT }}
                formatter={(v: unknown) => {
                  const n = Number(v);
                  return [`${n} decision${n !== 1 ? 's' : ''}`, ''];
                }}
              />
              <Line
                type='monotone'
                dataKey='count'
                stroke={ACCENT}
                strokeWidth={1.5}
                dot={{ fill: ACCENT, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: ACCENT }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
