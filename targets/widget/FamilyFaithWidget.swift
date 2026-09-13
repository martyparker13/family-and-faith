import WidgetKit
import SwiftUI

// MARK: - App Group

private let APP_GROUP = "group.com.C323.faithandfamily"

// MARK: - Entry

struct FaithEntry: TimelineEntry {
    let date: Date
    let day: Int
    let reading: Bool
    let devotional: Bool
    let prayer: Bool

    var doneCount: Int {
        [reading, devotional, prayer].filter { $0 }.count
    }
}

// MARK: - Provider

struct FaithProvider: TimelineProvider {
    func placeholder(in context: Context) -> FaithEntry {
        FaithEntry(date: .now, day: 1, reading: false, devotional: false, prayer: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (FaithEntry) -> Void) {
        completion(currentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<FaithEntry>) -> Void) {
        // Refresh at midnight so the widget resets for a new day
        let midnight = Calendar.current.startOfDay(for: .now).addingTimeInterval(86_400)
        completion(Timeline(entries: [currentEntry()], policy: .after(midnight)))
    }

    private func currentEntry() -> FaithEntry {
        let ud = UserDefaults(suiteName: APP_GROUP)
        return FaithEntry(
            date: .now,
            day:        max(1, ud?.integer(forKey: "ffm.day")        ?? 1),
            reading:    (ud?.integer(forKey: "ffm.reading")    ?? 0) == 1,
            devotional: (ud?.integer(forKey: "ffm.devotional") ?? 0) == 1,
            prayer:     (ud?.integer(forKey: "ffm.prayer")     ?? 0) == 1
        )
    }
}

// MARK: - Colors

private extension Color {
    static let ffCream  = Color(red: 253/255, green: 246/255, blue: 233/255)
    static let ffBrown  = Color(red:  61/255, green:  50/255, blue:  37/255)
    static let ffGold   = Color(red: 201/255, green: 154/255, blue:  59/255)
    static let ffMuted  = Color(red: 133/255, green: 118/255, blue:  95/255)
    static let ffGreen  = Color(red:  74/255, green: 140/255, blue: 100/255)
}

// MARK: - Subviews

struct ActivityRow: View {
    let label: String
    let done: Bool

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(done ? .ffGreen : .ffGold)
            Text(label)
                .font(.system(size: 13, design: .serif))
                .foregroundColor(done ? .ffMuted : .ffBrown)
                .strikethrough(done, color: .ffMuted)
        }
    }
}

// MARK: - Small Widget (2×2)

struct SmallView: View {
    let entry: FaithEntry

    var progressText: String {
        switch entry.doneCount {
        case 0: return "Start today"
        case 1: return "1 of 3 done"
        case 2: return "Almost there"
        case 3: return "All done! 🎉"
        default: return ""
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("Family & Faith")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundColor(.ffMuted)
                Spacer()
                Text("Day \(entry.day)")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.ffGold)
            }

            Rectangle()
                .fill(Color.ffGold.opacity(0.35))
                .frame(height: 1)
                .padding(.vertical, 5)

            Text(progressText)
                .font(.system(size: 11, weight: .semibold, design: .serif))
                .foregroundColor(entry.doneCount == 3 ? .ffGreen : .ffBrown)
                .padding(.bottom, 6)

            VStack(alignment: .leading, spacing: 4) {
                ActivityRow(label: "Reading",    done: entry.reading)
                ActivityRow(label: "Devotional", done: entry.devotional)
                ActivityRow(label: "Prayer",     done: entry.prayer)
            }

            Spacer(minLength: 0)
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

// MARK: - Medium Widget (4×2)

struct MediumView: View {
    let entry: FaithEntry

    var progressText: String {
        switch entry.doneCount {
        case 0: return "Start your day in the Word together"
        case 1: return "1 of 3 complete — keep going!"
        case 2: return "Almost there — one more!"
        case 3: return "All done for today! 🎉"
        default: return ""
        }
    }

    var body: some View {
        HStack(spacing: 0) {
            // Left column: branding + progress text
            VStack(alignment: .leading, spacing: 0) {
                Text("Family")
                    .font(.system(size: 22, weight: .bold, design: .serif))
                    .foregroundColor(.ffBrown)
                Text("& Faith")
                    .font(.system(size: 22, weight: .bold, design: .serif))
                    .foregroundColor(.ffGold)

                Spacer()

                Text("Day \(entry.day) · \(entry.doneCount)/3")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.ffMuted)

                Text(progressText)
                    .font(.system(size: 11, design: .serif))
                    .foregroundColor(entry.doneCount == 3 ? .ffGreen : .ffBrown)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            // Divider
            Rectangle()
                .fill(Color.ffGold.opacity(0.3))
                .frame(width: 1)
                .padding(.horizontal, 12)

            // Right column: activity checklist
            VStack(alignment: .leading, spacing: 8) {
                ActivityRow(label: "Reading",    done: entry.reading)
                ActivityRow(label: "Devotional", done: entry.devotional)
                ActivityRow(label: "Prayer",     done: entry.prayer)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Entry View

struct FaithWidgetEntryView: View {
    let entry: FaithEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        Group {
            if family == .systemMedium {
                MediumView(entry: entry)
            } else {
                SmallView(entry: entry)
            }
        }
        .background(Color.ffCream)
    }
}

// MARK: - Widget

@main
struct FamilyFaithWidget: Widget {
    let kind = "FamilyFaithWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FaithProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                FaithWidgetEntryView(entry: entry)
                    .containerBackground(Color.ffCream, for: .widget)
            } else {
                FaithWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Family & Faith")
        .description("Track your daily reading, devotional, and prayer.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Small — in progress", as: .systemSmall) {
    FamilyFaithWidget()
} timeline: {
    FaithEntry(date: .now, day: 47, reading: true, devotional: false, prayer: false)
}

#Preview("Small — all done", as: .systemSmall) {
    FamilyFaithWidget()
} timeline: {
    FaithEntry(date: .now, day: 47, reading: true, devotional: true, prayer: true)
}

#Preview("Medium — in progress", as: .systemMedium) {
    FamilyFaithWidget()
} timeline: {
    FaithEntry(date: .now, day: 47, reading: true, devotional: false, prayer: false)
}

#Preview("Medium — all done", as: .systemMedium) {
    FamilyFaithWidget()
} timeline: {
    FaithEntry(date: .now, day: 47, reading: true, devotional: true, prayer: true)
}
#endif
