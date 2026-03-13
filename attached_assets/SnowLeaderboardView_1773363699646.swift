import SwiftUI

struct SnowLeaderboardView: View {

    let resorts: [ResortForecastRow]

    var sortedResorts: [ResortForecastRow] {
        resorts.sorted {
            ($0.snow24hCm ?? 0) > ($1.snow24hCm ?? 0)
        }
    }

    var body: some View {

        VStack(alignment: .leading, spacing: 12) {

            HStack {
                Image(systemName: "trophy.fill")
                    .foregroundColor(.orange)

                Text("Top Snow Today")
                    .font(.headline)
            }

            ForEach(sortedResorts.prefix(5)) { resort in

                HStack {

                    Text(resort.name)
                        .font(.subheadline)

                    Spacer()

                    Text("\(resort.snow24hCm ?? 0) cm")
                        .font(.headline)
                        .foregroundColor(.blue)

                }

                Divider()
            }
        }
        .padding()
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .shadow(radius: 3)
    }
}
