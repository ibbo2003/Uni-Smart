import random
import pandas as pd
from typing import List, Dict, Tuple
from dataclasses import dataclass, field
from collections import defaultdict
import copy
import openpyxl
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
import os
import itertools
import openpyxl.utils

# --- Data Classes (Subject, Faculty, etc.) remain the same ---
# (These will be populated from DB data, not defined in code)
@dataclass
class Subject:
    subject_code: str; subject_name: str; subject_type: str; theory_hours: int; lab_hours: int
    theory_faculty: str; lab_faculty: str; no_of_batches: int; section: str; semester: str
@dataclass
class Faculty: id: str; name: str
@dataclass
class Section: id: str; name: str; semester: str; classroom: str
@dataclass
class LabRoom: id: str; name: str
@dataclass
class TimeSlot:
    day: int; period: int; subject_code: str; subject_name: str; subject_type: str
    faculty_id: str; section_id: str; room_id: str
    batch_number: int = 0; is_theory: bool = True

class TimetableChromosome:
    """Represents a single timetable solution"""

    def __init__(self, subjects: List[Subject], faculties: List[Faculty],
                sections: List[Section], lab_rooms: List[LabRoom],
                master_schedule: List[Dict], days_per_week: int = 6, periods_per_day: int = 7):
        self.subjects = subjects
        self.faculties = {f.id: f for f in faculties}
        self.sections = {s.id: s for s in sections}
        self.lab_rooms = {r.id: r for r in lab_rooms}
        self.master_schedule = master_schedule
        self.days_per_week = days_per_week
        self.periods_per_day = periods_per_day
        self.morning_periods = [0, 1, 2, 3]
        self.afternoon_periods = [4, 5, 6]
        self.genes = []
        self.fitness = 0.0
        self.lab_usage_tracker = defaultdict(set)
        for slot in self.master_schedule:
            if not slot.get('is_theory', True):
                self.lab_usage_tracker[(slot['day'], slot['period'])].add(slot['room_id'])


    # In TimetableChromosome class

    def initialize_random(self):
        """
        Initializes a timetable with the correct, prioritized scheduling order.
        """
        self.genes = []
        self.lab_usage_tracker = defaultdict(set)
        
        # --- CORRECTED ORDER ---
        # Step 1: Schedule Projects FIRST to reserve afternoon blocks.
        project_subjects = [s for s in self.subjects if s.subject_type == "PROJ"]
        for subject in project_subjects:
            self._schedule_project(subject, f"{subject.semester}_{subject.section}")

        # Step 2: Schedule Parallel Labs in the remaining slots.
        scheduled_lab_subjects = self._schedule_parallel_labs()
        
        # Step 3: Schedule any remaining SINGLE labs.
        lab_subjects = [
            s for s in self.subjects 
            if s.lab_hours > 0 
            and s.subject_type != "PROJ" 
            and s.subject_code not in scheduled_lab_subjects
        ]
        for subject in lab_subjects:
            self._schedule_lab_only(subject, f"{subject.semester}_{subject.section}")

        # Step 4: Schedule all theory classes.
        theory_hours_to_schedule = []
        theory_subjects = [s for s in self.subjects if s.theory_hours > 0 and s.subject_type != "PROJ"]
        for subject in theory_subjects:
            for _ in range(subject.theory_hours):
                theory_hours_to_schedule.append(subject)

        random.shuffle(theory_hours_to_schedule)
        for subject in theory_hours_to_schedule:
            self._schedule_one_theory_hour(subject, f"{subject.semester}_{subject.section}")
    
    def _schedule_project(self, subject: Subject, section_id: str):
        classroom = self.sections[section_id].classroom
        blocks_needed = subject.lab_hours // 3
        scheduled_blocks = 0
        possible_days = list(range(self.days_per_week))
        random.shuffle(possible_days)
        for day in possible_days:
            if scheduled_blocks >= blocks_needed: break
            is_afternoon_available = all(self._is_slot_available(day, p, subject.lab_faculty, section_id, classroom) for p in self.afternoon_periods)
            if is_afternoon_available:
                for period in self.afternoon_periods:
                    self.genes.append(TimeSlot(day=day, period=period, subject_code=subject.subject_code, subject_name=subject.subject_name, subject_type=subject.subject_type, faculty_id=subject.lab_faculty, section_id=section_id, room_id=classroom, is_theory=True))
                scheduled_blocks += 1
        if scheduled_blocks < blocks_needed: print(f"WARNING: For {section_id}, only scheduled {scheduled_blocks}/{blocks_needed} project blocks.")

    def _schedule_parallel_labs(self) -> set:
        scheduled_subjects = set()
        lab_subjects = [s for s in self.subjects if s.lab_hours > 0 and s.subject_type != "PROJ"]
        labs_by_section = defaultdict(list)
        for sub in lab_subjects: labs_by_section[f"{sub.semester}_{sub.section}"].append(sub)
        for section_id, labs in labs_by_section.items():
            if len(labs) < 2: continue
            num_parallel_labs = len(labs)
            sessions_needed = num_parallel_labs
            for session_index in range(sessions_needed):
                is_session_scheduled = False
                for _ in range(500):
                    day, start_period = random.randint(0, self.days_per_week - 1), random.choice([0, 2, 4])
                    if not self._is_valid_slot(day, start_period) or not self._is_valid_slot(day, start_period + 1): continue
                    faculties_needed = [l.lab_faculty for l in labs]
                    if any(not self._is_slot_available(day, p, fac, '', '') for p in range(start_period, start_period + 2) for fac in faculties_needed): continue
                    is_section_busy_with_theory = any(gene.day == day and gene.period in range(start_period, start_period + 2) and gene.section_id == section_id and gene.is_theory for gene in self.genes)
                    if is_section_busy_with_theory: continue
                    available_rooms = self._get_available_lab_rooms(day, start_period)
                    if len(available_rooms) < num_parallel_labs: continue
                    for batch_index in range(num_parallel_labs):
                        subject = labs[(batch_index + session_index) % num_parallel_labs]
                        room_id = available_rooms[batch_index]
                        self._reserve_lab_room(room_id, day, start_period)
                        for hour in range(2): self.genes.append(TimeSlot(day=day, period=start_period + hour, subject_code=subject.subject_code, subject_name=subject.subject_name, subject_type=subject.subject_type, faculty_id=subject.lab_faculty, section_id=section_id, room_id=room_id, batch_number=batch_index + 1, is_theory=False))
                    is_session_scheduled = True
                    break
                if not is_session_scheduled: print(f"WARNING: Failed to schedule parallel lab session {session_index + 1} for {section_id}")
            for lab in labs: scheduled_subjects.add(lab.subject_code)
        return scheduled_subjects

    def _is_valid_slot(self, day: int, period: int) -> bool:
        return not (day == 4 and period == 3)

    def _get_available_lab_rooms(self, day: int, start_period: int, duration: int = 2) -> List[str]:
        available_rooms = []
        for room_id in self.lab_rooms.keys():
            if all(room_id not in self.lab_usage_tracker.get((day, p), set()) for p in
                   range(start_period, start_period + duration)):
                available_rooms.append(room_id)
        return available_rooms

    def _reserve_lab_room(self, room_id: str, day: int, start_period: int, duration: int = 2):
        for period in range(start_period, start_period + duration):
            self.lab_usage_tracker[(day, period)].add(room_id)

    def _is_slot_available(self, day: int, period: int, faculty_id: str, section_id: str, room_id: str) -> bool:
        for gene in self.genes:
            if gene.day == day and gene.period == period:
                if faculty_id and gene.faculty_id == faculty_id: return False
                if section_id and gene.section_id == section_id: return False
                if room_id and gene.room_id == room_id: return False
        
        for booked_slot in self.master_schedule:
            if booked_slot['day'] == day and booked_slot['period'] == period:
                if faculty_id and booked_slot['faculty_id'] == faculty_id: return False
                if section_id and booked_slot['section_id'] == section_id: return False
                if room_id and booked_slot['room_id'] == room_id: return False
        
        return True

    def _calculate_slot_score(self, day: int, period: int, section_id: str, subject_code: str) -> int:
        score = 100
        day_periods = sorted([g.period for g in self.genes if g.section_id == section_id and g.day == day])
        if day_periods:
            if period == max(day_periods) + 1 or period == min(day_periods) - 1:
                score += 50
            else:
                score -= min(abs(period - p) for p in day_periods) * 10
        if any(g.subject_code == subject_code for g in self.genes if g.section_id == section_id and g.day == day):
            score -= 75
        return score

    def _schedule_one_theory_hour(self, subject: Subject, section_id: str):
        classroom = self.sections[section_id].classroom
        best_slot, best_score = None, -1

        for day in range(self.days_per_week):
            for period in self.morning_periods:
                if self._is_valid_slot(day, period) and self._is_slot_available(day, period, subject.theory_faculty,
                                                                                section_id, classroom):
                    score = self._calculate_slot_score(day, period, section_id, subject.subject_code)
                    if score > best_score:
                        best_score, best_slot = score, (day, period)

        if best_slot is None:
            all_periods = self.morning_periods + self.afternoon_periods
            random.shuffle(all_periods)
            for day in range(self.days_per_week):
                for period in all_periods:
                    if self._is_valid_slot(day, period) and self._is_slot_available(day, period, subject.theory_faculty,
                                                                                    section_id, classroom):
                        best_slot = (day, period)
                        break
                if best_slot: break

        if best_slot:
            day, period = best_slot
            self.genes.append(
                TimeSlot(day=day, period=period, subject_code=subject.subject_code, subject_name=subject.subject_name,
                         subject_type=subject.subject_type, faculty_id=subject.theory_faculty, section_id=section_id,
                         room_id=classroom))
        else:
            print(f"CRITICAL WARNING: Could not find slot for one hour of {subject.subject_code} in {section_id}.")

    def _schedule_lab_only(self, subject: Subject, section_id: str):
        for _ in range(subject.lab_hours // 2):
            scheduled = False
            attempts = 0
            while not scheduled and attempts < 200:
                day = random.randint(0, self.days_per_week - 1)
                start_period = random.choice([0, 2, 4])
                if self._is_valid_slot(day, start_period) and self._is_valid_slot(day, start_period + 1):
                    available_rooms = self._get_available_lab_rooms(day, start_period)
                    if len(available_rooms) >= subject.no_of_batches:
                        for batch in range(subject.no_of_batches):
                            room_id = available_rooms[batch]
                            self._reserve_lab_room(room_id, day, start_period)
                            for hour in range(2):
                                self.genes.append(
                                    TimeSlot(day=day, period=start_period + hour, subject_code=subject.subject_code,
                                             subject_name=subject.subject_name, subject_type=subject.subject_type,
                                             faculty_id=subject.lab_faculty, section_id=section_id, room_id=room_id,
                                             batch_number=batch + 1, is_theory=False))
                        scheduled = True
                        break
                attempts += 1
            if not scheduled:
                print(f"CRITICAL WARNING: Failed to schedule lab {subject.subject_code} for {section_id}.")

    def _check_project_continuity_and_completeness(self) -> int:
        """
        Applies a heavy penalty if a project is scheduled but doesn't take up
        the entire 3-hour afternoon block on a given day.
        """
        violations = 0
        project_slots = defaultdict(list)
        
        # Group all project periods by section and day
        for gene in self.genes:
            if gene.subject_type == "PROJ":
                project_slots[(gene.section_id, gene.day)].append(gene.period)
                
        for periods in project_slots.values():
            # Check if the block is incomplete (not 3 hours) or uses wrong periods
            if len(periods) != 3 or set(periods) != set(self.afternoon_periods):
                violations += 1
                
        return violations

    def _penalize_theory_in_afternoon(self) -> int:
        """Applies a penalty for theory classes scheduled in the afternoon."""
        violations = 0
        for gene in self.genes:
            if gene.is_theory and gene.subject_type != "PROJ" and gene.period in self.afternoon_periods:
                violations += 1
        return violations

    def _penalize_faculty_continuous_periods(self) -> int:
        """Applies a penalty if a faculty has continuous periods, with exceptions."""
        violations = 0
        faculty_schedule = defaultdict(list)
        for gene in self.genes:
            faculty_schedule[f"{gene.faculty_id}-{gene.day}"].append(gene)

        for schedule in faculty_schedule.values():
            if len(schedule) < 2:
                continue
            
            schedule.sort(key=lambda g: g.period)
            
            for i in range(len(schedule) - 1):
                g1 = schedule[i]
                g2 = schedule[i+1]

                # Check for continuous periods
                if g1.period + 1 == g2.period:
                    # Exception 1: It's a continuous lab session (which is required)
                    if not g1.is_theory and g1.subject_code == g2.subject_code:
                        continue
                    # Exception 2: Periods 2 and 3 (index 1 and 2)
                    if g1.period == 1:
                        continue
                    # Exception 3: Periods 4 and 5 (index 3 and 4)
                    if g1.period == 3:
                        continue
                    
                    violations += 1
        return violations

    # In TimetableChromosome class

    def _penalize_overloaded_faculty_days(self) -> int:
        """Applies a penalty if a faculty works more than 5 'hours' in a day.
        A 2-hour lab counts as one hour for this rule."""
        violations = 0
        faculty_daily_events = defaultdict(set)
        
        for gene in self.genes:
            key = (gene.faculty_id, gene.day)
            
            # If it's a theory class, add its period to count as one hour.
            if gene.is_theory:
                faculty_daily_events[key].add(gene.period)
            # If it's a lab, add the subject code. This ensures the 2-hour or 3-hour
            # block is only counted ONCE as a single event.
            else:
                faculty_daily_events[key].add(gene.subject_code)
                
        for events in faculty_daily_events.values():
            if len(events) > 5:
                violations += (len(events) - 5)
                
        return violations

# In TimetableChromosome class
    def calculate_fitness(self):
        fitness = 1000
        # Hard Constraints
        fitness -= self._check_conflicts(lambda g: (g.faculty_id, g.day, g.period)) * 500
        fitness -= self._check_conflicts(lambda g: (g.section_id, g.day, g.period)) * 500
        fitness -= self._check_conflicts(lambda g: (g.room_id, g.day, g.period), is_theory=True) * 400
        fitness -= self._check_conflicts(lambda g: (g.room_id, g.day, g.period), is_theory=False) * 400
        
        # Important Soft Constraints
        fitness -= self._check_lab_continuity() * 200
        fitness -= self._check_friday_fourth_hour() * 200
        fitness -= self._check_project_continuity_and_completeness() * 300 # <-- UPDATED & INCREASED PENALTY
        fitness -= self._penalize_faculty_continuous_periods() * 100 
        fitness -= self._penalize_overloaded_faculty_days() * 100

        # Standard Soft Constraints
        fitness -= self._check_gaps_in_schedule() * 100
        fitness -= self._check_theory_distribution() * 50
        fitness -= self._penalize_sparse_days() * 30
        fitness -= self._penalize_theory_in_afternoon() * 20

        self.fitness = max(0, fitness)
        return self.fitness

    def _check_conflicts(self, key_func, is_theory=None) -> int:
        conflicts = 0
        schedule = defaultdict(int)
        
        for gene in self.genes:
            # ▼▼▼ ADD THIS CHECK ▼▼▼
            # If a type (True/False) is specified, skip genes that don't match.
            if is_theory is not None and gene.is_theory != is_theory:
                continue
            # ▲▲▲ END OF CHECK ▲▲▲
            
            key = key_func(gene)
            if key is not None:
                schedule[key] += 1
                
        for count in schedule.values():
            if count > 1:
                conflicts += (count - 1)
                
        return conflicts

    def _check_lab_continuity(self) -> int:
        violations, lab_sessions = 0, defaultdict(list)
        for gene in self.genes:
            if not gene.is_theory: lab_sessions[
                (gene.subject_code, gene.section_id, gene.batch_number, gene.day)].append(gene.period)
        for periods in lab_sessions.values():
            if len(periods) > 1 and (max(periods) - min(periods) + 1) != len(periods): violations += 1
        return violations

    def _check_project_afternoon_blocks(self) -> int:
        return sum(1 for g in self.genes if g.subject_type == "PROJ" and g.period not in self.afternoon_periods)

    def _check_friday_fourth_hour(self) -> int:
        return sum(1 for g in self.genes if g.day == 4 and g.period == 3)

    def _check_theory_distribution(self) -> int:
        violations, theory_counts = 0, defaultdict(lambda: defaultdict(int))
        for gene in self.genes:
            if gene.is_theory and gene.subject_type != "PROJ": theory_counts[(gene.subject_code, gene.section_id)][
                gene.day] += 1
        for daily_counts in theory_counts.values():
            for count in daily_counts.values():
                if count > 2:
                    violations += count - 2
                elif count == 2:
                    violations += 1
        return violations

    def _check_gaps_in_schedule(self) -> int:
        violations, section_daily = 0, defaultdict(list)
        for gene in self.genes: section_daily[gene.section_id].append((gene.day, gene.period))
        for schedule in section_daily.values():
            daily_periods = defaultdict(list)
            for day, period in schedule: daily_periods[day].append(period)
            for periods in daily_periods.values():
                if not periods: continue
                periods.sort()
                morning = [p for p in periods if p < 4]
                if morning:
                    if morning[0] != 0: violations += morning[0] * 5
                    violations += (max(morning) - min(morning) + 1 - len(morning)) * 3
        return violations

    def _penalize_sparse_days(self) -> int:
        """Applies a penalty for days with too few classes."""
        violations = 0
        section_daily_counts = defaultdict(lambda: defaultdict(int))
        for gene in self.genes:
            section_daily_counts[gene.section_id][gene.day] += 1

        for daily_counts in section_daily_counts.values():
            for count in daily_counts.values():
                if count == 1:
                    violations += 10  # Heavy penalty for a single-class day
                elif count == 2:
                    violations += 5  # Lighter penalty for a two-class day
        return violations

    # Add this new method inside your TimetableChromosome class

    def repair_conflicts(self):
        """
        Finds and attempts to fix faculty and section conflicts by moving
        colliding classes to a free slot.
        """
        # 1. Identify all conflicts first
        # Key: (type, id, day, period), Value: list of genes causing the conflict
        conflict_map = defaultdict(list)
        for i, gene in enumerate(self.genes):
            # Use the gene's index 'i' as a unique identifier
            conflict_map[("faculty", gene.faculty_id, gene.day, gene.period)].append(i)
            conflict_map[("section", gene.section_id, gene.day, gene.period)].append(i)
            # You could also add room conflicts here if needed

        # 2. Iterate through the identified conflicts and try to repair them
        for key, conflicting_indices in conflict_map.items():
            if len(conflicting_indices) <= 1:
                continue  # No conflict here

            # Keep the first gene, try to move the others
            for gene_index in conflicting_indices[1:]:
                gene_to_move = self.genes[gene_index]

                # Find a new, valid slot for this gene
                found_new_slot = False
                possible_periods = self.morning_periods + self.afternoon_periods
                random.shuffle(possible_periods)

                for new_day in random.sample(range(self.days_per_week), self.days_per_week):
                    for new_period in possible_periods:
                        # Check if the proposed new slot is valid and available
                        if self._is_valid_slot(new_day, new_period) and \
                                self._is_slot_available(new_day, new_period,
                                                        gene_to_move.faculty_id,
                                                        gene_to_move.section_id,
                                                        gene_to_move.room_id):
                            # Move the gene to the new free slot
                            self.genes[gene_index].day = new_day
                            self.genes[gene_index].period = new_period
                            found_new_slot = True
                            break  # Stop searching for a slot
                    if found_new_slot:
                        break  # Stop searching for a day

    # NEW: Enhanced Local Search based on research paper
    def intensive_local_search(self):
        for _ in range(20):
            gene_idx = random.randint(0, len(self.genes) - 1)
            gene_to_move = self.genes[gene_idx]
            if not gene_to_move.is_theory or gene_to_move.subject_type == "PROJ": continue

            original_day, original_period = gene_to_move.day, gene_to_move.period
            best_new_slot = None
            current_fitness = self.calculate_fitness()

            for new_day in random.sample(range(self.days_per_week), self.days_per_week):
                for new_period in random.sample(self.morning_periods + self.afternoon_periods, self.periods_per_day):
                    if self._is_valid_slot(new_day, new_period) and \
                       self._is_slot_available(new_day, new_period, gene_to_move.faculty_id,
                                                gene_to_move.section_id, gene_to_move.room_id):
                        
                        gene_to_move.day, gene_to_move.period = new_day, new_period
                        new_fitness = self.calculate_fitness()
                        if new_fitness > current_fitness:
                            current_fitness = new_fitness
                            best_new_slot = (new_day, new_period)
                        gene_to_move.day, gene_to_move.period = original_day, original_period
            
            if best_new_slot:
                self.genes[gene_idx].day = best_new_slot[0]
                self.genes[gene_idx].period = best_new_slot[1]

# Main function to run the GA
# scheduler.py

# ... (all your dataclasses and the TimetableChromosome class are above this) ...

# This function replaces the ExcelTimetableScheduler class and main()
def generate_semester_timetable(subjects_data, faculties_data, sections_data, lab_rooms_data, master_schedule_data):
    # --- GA Parameters ---
    population_size = 150
    generations = 600
    crossover_rate = 0.9
    mutation_rate = 0.15

    # --- Convert dictionaries to dataclass objects ---
    subjects = [Subject(**s) for s in subjects_data]
    faculties = [Faculty(**f) for f in faculties_data.values()]
    sections = [Section(**s) for s in sections_data.values()]
    lab_rooms = [LabRoom(**r) for r in lab_rooms_data.values()]
    
    # ▼▼▼ HELPER FUNCTIONS (Logic from your old class) ▼▼▼
    def selection(population):
        return max(random.sample(population, 3), key=lambda x: x.fitness)

    def crossover(p1, p2):
        if random.random() > crossover_rate or len(p1.genes) <= 1 or len(p2.genes) <= 1:
            return copy.deepcopy(p1), copy.deepcopy(p2)
        pt = random.randint(1, min(len(p1.genes), len(p2.genes)) - 1)
        c1, c2 = copy.deepcopy(p1), copy.deepcopy(p2)
        c1.genes, c2.genes = p1.genes[:pt] + p2.genes[pt:], p2.genes[:pt] + p1.genes[pt:]
        return c1, c2

    def mutate(chromosome):
        if random.random() < mutation_rate and len(chromosome.genes) >= 2:
            idx1, idx2 = random.sample(range(len(chromosome.genes)), 2)
            chromosome.genes[idx1], chromosome.genes[idx2] = chromosome.genes[idx2], chromosome.genes[idx1]
    # ▲▲▲ END OF HELPER FUNCTIONS ▲▲▲

    # --- Initialize Population ---
    population = []
    for _ in range(population_size):
        chromosome = TimetableChromosome(subjects, faculties, sections, lab_rooms, master_schedule_data)
        chromosome.initialize_random()
        chromosome.calculate_fitness()
        population.append(chromosome)

    best_chromosome = None
    for generation in range(generations):
        population.sort(key=lambda x: x.fitness, reverse=True)
        if not best_chromosome or population[0].fitness > best_chromosome.fitness:
            best_chromosome = copy.deepcopy(population[0])
        if generation % 100 == 0:
            print(f"Gen {generation}: Best Fitness = {best_chromosome.fitness:.2f}")

        # --- Elitism and Local Search ---
        next_pop = population[:population_size // 10]
        for elite in next_pop:
            elite.intensive_local_search()
            elite.calculate_fitness()

        # --- Generate New Population ---
        while len(next_pop) < population_size:
            p1, p2 = selection(population), selection(population)
            c1, c2 = crossover(p1, p2)
            
            # ▼▼▼ CORRECTED CALLS ▼▼▼
            mutate(c1)
            mutate(c2)
            
            c1.repair_conflicts()
            c2.repair_conflicts()
            
            c1.calculate_fitness()
            c2.calculate_fitness()
            
            next_pop.extend([c1, c2])

        population = next_pop[:population_size]

    print(f"Evolution finished. Best fitness: {best_chromosome.fitness:.2f}")
    
    final_timetable = [gene.__dict__ for gene in best_chromosome.genes]
    return final_timetable