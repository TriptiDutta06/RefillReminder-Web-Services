package com.refillreminder.config;

import com.refillreminder.model.Refill;
import com.refillreminder.repository.RefillRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(RefillRepository repository) {
        return args -> {
            // IMPORTANT: Only seed data if the collection is empty
            long existingCount = repository.count();
            if (existingCount > 0) {
                System.out.println("🌸 [RefillReminder] MongoDB collection 'refills' already has " + existingCount + " documents. Skipping seed data.");
                return;
            }

            LocalDate today = LocalDate.now();

            List<Refill> sampleRefills = List.of(
                    new Refill(
                            "Shampoo",
                            "Personal Care",
                            250.0,
                            "ml",
                            "High",
                            today.minusDays(25),
                            today.plusDays(3),
                            "Running Low",
                            "Buy herbal shampoo"
                    ),
                    new Refill(
                            "Hand Wash",
                            "Personal Care",
                            200.0,
                            "ml",
                            "Medium",
                            today.minusDays(40),
                            today.minusDays(1),
                            "Running Low",
                            "Lavender scent for bathroom and kitchen sinks"
                    ),
                    new Refill(
                            "Detergent",
                            "Laundry",
                            500.0,
                            "grams",
                            "High",
                            today.minusDays(15),
                            today.plusDays(15),
                            "Needed",
                            "Front-load washing machine powder"
                    ),
                    new Refill(
                            "Dishwashing Liquid",
                            "Cleaning",
                            500.0,
                            "ml",
                            "High",
                            today.minusDays(20),
                            today.plusDays(2),
                            "Due Soon",
                            "Lemon degreaser, 750ml refill pouch"
                    ),
                    new Refill(
                            "Floor Cleaner",
                            "Cleaning",
                            1000.0,
                            "ml",
                            "Medium",
                            today.minusDays(30),
                            today.plusDays(5),
                            "Due Soon",
                            "Citrus fresh fragrance"
                    )
            );

            repository.saveAll(sampleRefills);
            System.out.println("🌸 [RefillReminder] Successfully seeded " + sampleRefills.size() + " sample refill records into MongoDB (refillreminder.refills)!");
        };
    }
}
