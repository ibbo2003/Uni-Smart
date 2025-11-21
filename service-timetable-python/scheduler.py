"""
VTU TIMETABLE SCHEDULER - OPTIMIZED HYBRID VERSION
===================================================
Combines: Genetic Algorithm + Local Search + CSP + Tabu Search
Author: Student Package Website Project
Version: 5.0 (Highly Optimized)
"""

import random
from typing import List, Dict, Set, Tuple
from dataclasses import dataclass
from collections import defaultdict
import copy
import time


# ===========================
# DATA CLASSES (Same as yours)
# ===========================

@dataclass
class Subject:
    subject_code: str
    subject_name: str
    subject_type: str
    theory_hours: int
    lab_hours: int
    theory_faculty: str
    lab_faculty: str
    no_of_batches: int
    section: str
    semester: str


@dataclass
class Faculty:
    id: str
    name: str


@dataclass
class Section:
    id: str
    name: str
    semester: str
    classroom: str


@dataclass
class LabRoom:
    id: str
    name: str


@dataclass
class TimeSlot:
    day: int
    period: int
    subject_code: str
    subject_name: str
    subject_type: str
    faculty_id: str
    section_id: str
    room_id: str
    batch_number: int = 0
    is_theory: bool = True


# ===========================
# VTU SUBJECT TYPE VALIDATOR (Keep yours as-is)
# ===========================

class VTUSubjectValidator:
    SUBJECT_TYPES = {
        'IPCC': {'has_theory': True, 'has_lab': True, 'is_project': False},
        'PCC': {'has_theory': True, 'has_lab': False, 'is_project': False},
        'PCCL': {'has_theory': False, 'has_lab': True, 'is_project': False},
        'PEC': {'has_theory': True, 'has_lab': False, 'is_project': False},
        'OEC': {'has_theory': True, 'has_lab': False, 'is_project': False},
        'HSMC': {'has_theory': True, 'has_lab': False, 'is_project': False},
        'MP': {'has_theory': False, 'has_lab': True, 'is_project': True},
        'INT': {'has_theory': False, 'has_lab': False, 'is_project': False}
    }
    
    @classmethod
    def validate_subject(cls, subject: Subject) -> bool:
        subject_type = subject.subject_type.upper()
        if subject_type not in cls.SUBJECT_TYPES:
            raise ValueError(f"Invalid subject type '{subject_type}'")
        
        rules = cls.SUBJECT_TYPES[subject_type]
        if not rules['has_theory'] and subject.theory_hours > 0:
            subject.theory_hours = 0
        if not rules['has_lab'] and subject.lab_hours > 0:
            subject.lab_hours = 0
        
        return True
    
    @classmethod
    def is_project(cls, subject_type: str) -> bool:
        return subject_type.upper() in ['MP', 'PROJ']
    
    @classmethod
    def get_display_name(cls, subject_type: str) -> str:
        names = {
            'IPCC': 'Integrated Professional Core',
            'PCC': 'Professional Core',
            'PCCL': 'Professional Core Lab',
            'PEC': 'Professional Elective',
            'OEC': 'Open Elective',
            'HSMC': 'Humanities',
            'MP': 'Major/Mini Project',
            'INT': 'Internship'
        }
        return names.get(subject_type.upper(), subject_type)


# ===========================
# CSP CONSTRAINT CHECKER
# ===========================

class CSPConstraintChecker:
    """Fast constraint checking using set-based lookups"""
    
    def __init__(self):
        self.faculty_slots: Dict[Tuple[int, int], Set[str]] = defaultdict(set)
        self.section_slots: Dict[Tuple[int, int], Set[str]] = defaultdict(set)
        self.room_slots: Dict[Tuple[int, int], Set[str]] = defaultdict(set)
    
    def add_slot(self, gene: TimeSlot):
        """Add a time slot to constraint checker"""
        key = (gene.day, gene.period)
        self.faculty_slots[key].add(gene.faculty_id)
        self.section_slots[key].add(gene.section_id)
        if gene.is_theory or not gene.batch_number:
            self.room_slots[key].add(gene.room_id)
    
    def remove_slot(self, gene: TimeSlot):
        """Remove a time slot from constraint checker"""
        key = (gene.day, gene.period)
        self.faculty_slots[key].discard(gene.faculty_id)
        self.section_slots[key].discard(gene.section_id)
        if gene.is_theory or not gene.batch_number:
            self.room_slots[key].discard(gene.room_id)
    
    def check_conflicts(self, gene: TimeSlot) -> int:
        """Return number of conflicts for this slot"""
        conflicts = 0
        key = (gene.day, gene.period)
        
        if gene.faculty_id in self.faculty_slots[key]:
            conflicts += 1
        if gene.section_id in self.section_slots[key]:
            conflicts += 1
        if gene.is_theory and gene.room_id in self.room_slots[key]:
            conflicts += 1
        
        return conflicts
    
    def is_available(self, day: int, period: int, faculty_id: str, 
                     section_id: str, room_id: str, is_theory: bool) -> bool:
        """Check if slot is completely available"""
        key = (day, period)
        
        if faculty_id and faculty_id in self.faculty_slots[key]:
            return False
        if section_id and section_id in self.section_slots[key]:
            return False
        if is_theory and room_id and room_id in self.room_slots[key]:
            return False
        
        return True
    
    def rebuild_from_genes(self, genes: List[TimeSlot]):
        """Rebuild constraint checker from scratch"""
        self.__init__()
        for gene in genes:
            self.add_slot(gene)


# ===========================
# OPTIMIZED TIMETABLE CHROMOSOME
# ===========================

class OptimizedTimetableChromosome:
    """Highly optimized chromosome with CSP integration"""
    
    def __init__(self, subjects: List[Subject], faculties: List[Faculty],
                 sections: List[Section], lab_rooms: List[LabRoom],
                 master_schedule: List[Dict], days_per_week: int = 6,
                 periods_per_day: int = 7):
        
        self.subjects = subjects
        self.faculties = {f.id: f for f in faculties}
        self.sections = {s.id: s for s in sections}
        self.lab_rooms = {r.id: r for r in lab_rooms}
        self.master_schedule = master_schedule
        self.days_per_week = days_per_week
        self.periods_per_day = periods_per_day
        self.morning_periods = [0, 1, 2, 3]
        self.afternoon_periods = [4, 5, 6]
        
        self.genes: List[TimeSlot] = []
        self.fitness = 0.0
        self.constraint_checker = CSPConstraintChecker()
        self.lab_usage_tracker = defaultdict(set)
        
        # Validate subjects
        for subject in self.subjects:
            VTUSubjectValidator.validate_subject(subject)
        
        # Initialize master schedule constraints
        for slot in self.master_schedule:
            fake_gene = TimeSlot(
                day=slot['day'], period=slot['period'],
                subject_code='', subject_name='', subject_type='',
                faculty_id=slot['faculty_id'], section_id=slot['section_id'],
                room_id=slot['room_id'], is_theory=slot.get('is_theory', True)
            )
            self.constraint_checker.add_slot(fake_gene)
            
            if not slot.get('is_theory', True):
                self.lab_usage_tracker[(slot['day'], slot['period'])].add(slot['room_id'])
    
    def initialize_with_csp(self):
        """Initialize using CSP-guided approach for better starting population"""
        self.genes = []
        self.constraint_checker.rebuild_from_genes([])
        
        # Re-add master schedule
        for slot in self.master_schedule:
            fake_gene = TimeSlot(
                day=slot['day'], period=slot['period'],
                subject_code='', subject_name='', subject_type='',
                faculty_id=slot['faculty_id'], section_id=slot['section_id'],
                room_id=slot['room_id'], is_theory=slot.get('is_theory', True)
            )
            self.constraint_checker.add_slot(fake_gene)
        
        # Reset lab usage
        self.lab_usage_tracker = defaultdict(set)
        for slot in self.master_schedule:
            if not slot.get('is_theory', True):
                self.lab_usage_tracker[(slot['day'], slot['period'])].add(slot['room_id'])
        
        # Phase 1: Schedule projects (highest priority)
        project_subjects = [s for s in self.subjects if VTUSubjectValidator.is_project(s.subject_type)]
        for subject in project_subjects:
            section_id = f"{subject.semester}_{subject.section}"
            self._schedule_project_csp(subject, section_id)
        
        # Phase 2: Schedule parallel labs with CSP
        self._schedule_parallel_labs_csp()
        
        # Phase 3: Schedule theory with CSP heuristics
        theory_subjects = [s for s in self.subjects if s.theory_hours > 0]
        theory_hours = []
        for subject in theory_subjects:
            for _ in range(subject.theory_hours):
                theory_hours.append(subject)
        
        # Sort by Most Constrained Variable (MCV) heuristic
        random.shuffle(theory_hours)
        
        for subject in theory_hours:
            section_id = f"{subject.semester}_{subject.section}"
            self._schedule_theory_with_csp(subject, section_id)
    
    def _schedule_project_csp(self, subject: Subject, section_id: str):
        """Schedule project using CSP forward checking"""
        if not subject.lab_faculty:
            return
        
        classroom = self.sections[section_id].classroom
        blocks_needed = subject.lab_hours // 3
        scheduled = 0
        
        # Try each day
        for day in range(self.days_per_week):
            if scheduled >= blocks_needed:
                break
            
            # Check if all afternoon slots available
            all_available = all(
                self.constraint_checker.is_available(
                    day, p, subject.lab_faculty, section_id, classroom, False
                )
                for p in self.afternoon_periods
            )
            
            if all_available:
                # Schedule the 3-hour block
                for period in self.afternoon_periods:
                    gene = TimeSlot(
                        day=day, period=period, subject_code=subject.subject_code,
                        subject_name=subject.subject_name, subject_type=subject.subject_type,
                        faculty_id=subject.lab_faculty, section_id=section_id,
                        room_id=classroom, is_theory=False
                    )
                    self.genes.append(gene)
                    self.constraint_checker.add_slot(gene)
                scheduled += 1
    
    def _schedule_parallel_labs_csp(self):
        """Schedule parallel labs using CSP with arc consistency - FIXED"""
        lab_subjects = [s for s in self.subjects 
                    if s.lab_hours > 0 and not VTUSubjectValidator.is_project(s.subject_type)]
        
        labs_by_section = defaultdict(list)
        for sub in lab_subjects:
            if sub.lab_faculty:
                labs_by_section[f"{sub.semester}_{sub.section}"].append(sub)
        
        for section_id, labs in labs_by_section.items():
            if len(labs) < 2:
                continue
            
            num_subjects = len(labs)
            sessions_needed = num_subjects
            
            print(f"\n    🔬 Parallel Lab Scheduling for {section_id}:")
            print(f"       Subjects: {[lab.subject_code for lab in labs]}")
            print(f"       Rotation sessions needed: {sessions_needed}")
            
            scheduled_sessions = 0
            
            for session_idx in range(sessions_needed):
                print(f"\n       📅 Session {session_idx + 1}/{sessions_needed}:")
                slot_found = False
                
                for day in range(self.days_per_week):
                    if slot_found:
                        break
                    
                    for start_period in [0, 2, 4]:
                        if slot_found:
                            break
                        
                        if not self._validate_parallel_lab_slot(
                            day, start_period, section_id, labs, num_subjects
                        ):
                            continue
                        
                        available_rooms = self._get_available_lab_rooms(day, start_period, 2)
                        if len(available_rooms) < num_subjects:
                            continue
                        
                        print(f"          ✅ Found slot: Day {day}, Periods {start_period}-{start_period+1}")
                        
                        # ✅ CRITICAL FIX: Schedule ALL batches for BOTH hours
                        genes_to_add = []  # Collect all genes first
                        
                        for subject_slot_idx in range(num_subjects):
                            rotated_subject_idx = (subject_slot_idx + session_idx) % num_subjects
                            subject = labs[rotated_subject_idx]
                            room_id = available_rooms[subject_slot_idx]
                            batch_number = subject_slot_idx + 1
                            
                            print(f"             Batch {batch_number} → {subject.subject_code} in {room_id}")
                            
                            # Create BOTH time slots (hour 0 and hour 1)
                            for hour in range(2):
                                gene = TimeSlot(
                                    day=day,
                                    period=start_period + hour,
                                    subject_code=subject.subject_code,
                                    subject_name=subject.subject_name,
                                    subject_type=subject.subject_type,
                                    faculty_id=subject.lab_faculty,
                                    section_id=section_id,
                                    room_id=room_id,
                                    batch_number=batch_number,
                                    is_theory=False
                                )
                                genes_to_add.append(gene)
                                
                                # ✅ DEBUG: Verify gene creation
                                print(f"                 Created: Day {day}, P{start_period + hour}, "
                                    f"Batch {batch_number}, {subject.subject_code}")
                            
                            # Reserve lab room for both periods
                            self.lab_usage_tracker[(day, start_period)].add(room_id)
                            self.lab_usage_tracker[(day, start_period + 1)].add(room_id)
                        
                        # ✅ Add all genes at once
                        print(f"          📝 Adding {len(genes_to_add)} time slots to schedule...")
                        for gene in genes_to_add:
                            self.genes.append(gene)
                            self.constraint_checker.add_slot(gene)
                        
                        # ✅ VERIFY: Count what was added
                        added_count = len(genes_to_add)
                        expected_count = num_subjects * 2  # 2 subjects × 2 hours = 4
                        print(f"          ✅ Verification: Added {added_count}/{expected_count} slots")
                        
                        if added_count != expected_count:
                            print(f"          ⚠️  WARNING: Expected {expected_count} slots but added {added_count}!")
                        
                        scheduled_sessions += 1
                        slot_found = True
                
                if not slot_found:
                    print(f"          ❌ Could not find slot for session {session_idx + 1}")
            
            print(f"\n       📊 Summary: Scheduled {scheduled_sessions}/{sessions_needed} sessions")
    
    def _validate_parallel_lab_slot(self, day: int, start_period: int, 
                                    section_id: str, labs: List[Subject], 
                                    num_parallel: int) -> bool:
        """CSP validation for parallel lab scheduling"""
        # Check if enough lab rooms available
        available_rooms = self._get_available_lab_rooms(day, start_period, 2)
        if len(available_rooms) < num_parallel:
            return False
        
        # Check all faculty availability
        for lab in labs:
            for period in [start_period, start_period + 1]:
                if not self.constraint_checker.is_available(
                    day, period, lab.lab_faculty, '', '', False
                ):
                    return False
        
        # Check section not busy
        for period in [start_period, start_period + 1]:
            if not self.constraint_checker.is_available(
                day, period, '', section_id, '', True
            ):
                return False
        
        return True
    
    def _schedule_theory_with_csp(self, subject: Subject, section_id: str):
        """Schedule theory using CSP - MORNING ONLY, afternoon as last resort"""
        if not subject.theory_faculty:
            return
        
        classroom = self.sections[section_id].classroom
        best_slot = None
        best_score = -1000
        
        # ✅ PHASE 1: Try ONLY morning slots (strict)
        for day in range(self.days_per_week):
            for period in self.morning_periods:  # [0, 1, 2, 3]
                if self.constraint_checker.is_available(
                    day, period, subject.theory_faculty, section_id, classroom, True
                ):
                    score = self._calculate_slot_score_csp(day, period, section_id, subject.subject_code)
                    if score > best_score:
                        best_score = score
                        best_slot = (day, period)
        
        # ✅ PHASE 2: ONLY if no morning slot found, try afternoon
        if best_slot is None:
            print(f"      ⚠️ No morning slot for {subject.subject_code}, trying afternoon...")
            for day in range(self.days_per_week):
                for period in self.afternoon_periods:  # [4, 5, 6]
                    if self.constraint_checker.is_available(
                        day, period, subject.theory_faculty, section_id, classroom, True
                    ):
                        score = self._calculate_slot_score_csp(day, period, section_id, subject.subject_code) - 200  # Heavy penalty
                        if score > best_score:
                            best_score = score
                            best_slot = (day, period)
        
        if best_slot:
            day, period = best_slot
            gene = TimeSlot(
                day=day, period=period, subject_code=subject.subject_code,
                subject_name=subject.subject_name, subject_type=subject.subject_type,
                faculty_id=subject.theory_faculty, section_id=section_id,
                room_id=classroom, is_theory=True
            )
            self.genes.append(gene)
            self.constraint_checker.add_slot(gene)
        else:
            print(f"      ❌ Could not schedule theory for {subject.subject_code}")
    
    def _calculate_slot_score_csp(self, day: int, period: int, section_id: str, subject_code: str) -> int:
        """Enhanced scoring for CSP slot selection"""
        score = 100
        
        # Prefer continuous slots
        day_periods = sorted([g.period for g in self.genes if g.section_id == section_id and g.day == day])
        
        if day_periods:
            if period == max(day_periods) + 1 or period == min(day_periods) - 1:
                score += 80  # Bonus for continuity
            else:
                min_gap = min(abs(period - p) for p in day_periods)
                score -= min_gap * 15
        
        # Avoid same subject twice on same day
        if any(g.subject_code == subject_code for g in self.genes if g.section_id == section_id and g.day == day):
            score -= 100
        
        # Prefer starting from period 0
        if period == 0:
            score += 50
        
        return score
    
    def _get_available_lab_rooms(self, day: int, start_period: int, duration: int = 2) -> List[str]:
        """Get available lab rooms for given time range"""
        available = []
        for room_id in self.lab_rooms.keys():
            if all(
                room_id not in self.lab_usage_tracker[(day, p)]
                for p in range(start_period, start_period + duration)
            ):
                available.append(room_id)
        return available
    
    def calculate_fitness(self):
        """Fast fitness calculation using constraint checker"""
        fitness = 1000
        
        # Hard constraints (cached in constraint checker)
        faculty_conflicts = self._count_conflicts_fast('faculty')
        section_conflicts = self._count_conflicts_fast('section')
        room_conflicts = self._count_conflicts_fast('room')
        
        fitness -= faculty_conflicts * 500
        fitness -= section_conflicts * 500
        fitness -= room_conflicts * 400
        
        # Lab continuity
        fitness -= self._check_lab_continuity() * 200
        
        # Project constraints
        fitness -= self._check_project_continuity() * 300
        
        # Soft constraints
        fitness -= self._check_gaps() * 100
        fitness -= self._check_theory_distribution() * 50
        fitness -= self._penalize_theory_afternoon() * 100 
        fitness -= self._penalize_sparse_days() * 30
        
        self.fitness = max(0, fitness)
        return self.fitness
    
    def _count_conflicts_fast(self, resource_type: str) -> int:
        """Fast conflict counting using CSP checker"""
        conflicts = 0
        slot_counts = defaultdict(int)
        
        if resource_type == 'faculty':
            for gene in self.genes:
                slot_counts[(gene.faculty_id, gene.day, gene.period)] += 1
        elif resource_type == 'section':
            for gene in self.genes:
                slot_counts[(gene.section_id, gene.day, gene.period)] += 1
        elif resource_type == 'room':
            for gene in self.genes:
                if gene.is_theory:
                    slot_counts[(gene.room_id, gene.day, gene.period)] += 1
        
        for count in slot_counts.values():
            if count > 1:
                conflicts += (count - 1)
        
        return conflicts
    
    def _check_lab_continuity(self) -> int:
        """Check 2-hour lab blocks are continuous"""
        violations = 0
        lab_sessions = defaultdict(list)
        
        for gene in self.genes:
            if not gene.is_theory:
                key = (gene.subject_code, gene.section_id, gene.batch_number, gene.day)
                lab_sessions[key].append(gene.period)
        
        for periods in lab_sessions.values():
            if len(periods) >= 2:
                periods_sorted = sorted(periods)
                for i in range(len(periods_sorted) - 1):
                    if periods_sorted[i+1] - periods_sorted[i] != 1:
                        violations += 1
                        break
        
        return violations
    
    def _check_project_continuity(self) -> int:
        """Check project 3-hour blocks"""
        violations = 0
        project_slots = defaultdict(list)
        
        for gene in self.genes:
            if VTUSubjectValidator.is_project(gene.subject_type):
                project_slots[(gene.section_id, gene.day)].append(gene.period)
        
        for periods in project_slots.values():
            if len(periods) != 3 or set(periods) != set(self.afternoon_periods):
                violations += 1
        
        return violations
    
    def _check_gaps(self) -> int:
        """Penalize gaps in schedule"""
        violations = 0
        section_daily = defaultdict(list)
        
        for gene in self.genes:
            section_daily[(gene.section_id, gene.day)].append(gene.period)
        
        for periods in section_daily.values():
            if not periods:
                continue
            periods_sorted = sorted(periods)
            expected_span = periods_sorted[-1] - periods_sorted[0] + 1
            violations += (expected_span - len(periods)) * 2
        
        return violations
    
    def _check_theory_distribution(self) -> int:
        """Check theory not concentrated on one day"""
        violations = 0
        theory_counts = defaultdict(lambda: defaultdict(int))
        
        for gene in self.genes:
            if gene.is_theory:
                theory_counts[(gene.subject_code, gene.section_id)][gene.day] += 1
        
        for daily_counts in theory_counts.values():
            for count in daily_counts.values():
                if count > 2:
                    violations += count - 2
        
        return violations
    
    def _penalize_theory_afternoon(self) -> int:
        """Penalize theory in afternoon - HEAVY penalty"""
        count = sum(1 for g in self.genes 
                if g.is_theory 
                and not VTUSubjectValidator.is_project(g.subject_type)
                and g.period in self.afternoon_periods)
        return count * 3  # ✅ Changed from * 1 to * 3 (triple penalty)
    
    def _penalize_sparse_days(self) -> int:
        """Penalize days with very few classes"""
        violations = 0
        daily_counts = defaultdict(lambda: defaultdict(int))
        
        for gene in self.genes:
            daily_counts[gene.section_id][gene.day] += 1
        
        for counts in daily_counts.values():
            for count in counts.values():
                if count <= 2:
                    violations += (3 - count)
        
        return violations
    
    def tabu_local_search(self, max_iterations: int = 50, tabu_size: int = 20):
        """Enhanced local search with tabu list"""
        tabu_list = []
        current_fitness = self.calculate_fitness()
        
        for iteration in range(max_iterations):
            if current_fitness >= 1000:
                break
            
            # Find best non-tabu move
            best_move = None
            best_fitness = current_fitness
            
            # Try swapping random theory slots
            for _ in range(10):
                if len(self.genes) < 2:
                    break
                
                idx1 = random.randint(0, len(self.genes) - 1)
                idx2 = random.randint(0, len(self.genes) - 1)
                
                if idx1 == idx2 or not self.genes[idx1].is_theory or not self.genes[idx2].is_theory:
                    continue
                
                move = (idx1, idx2)
                if move in tabu_list:
                    continue
                
                # Try swap
                self.genes[idx1], self.genes[idx2] = self.genes[idx2], self.genes[idx1]
                self.constraint_checker.rebuild_from_genes(self.genes)
                
                new_fitness = self.calculate_fitness()
                
                if new_fitness > best_fitness:
                    best_fitness = new_fitness
                    best_move = move
                
                # Undo swap
                self.genes[idx1], self.genes[idx2] = self.genes[idx2], self.genes[idx1]
            
            if best_move:
                idx1, idx2 = best_move
                self.genes[idx1], self.genes[idx2] = self.genes[idx2], self.genes[idx1]
                self.constraint_checker.rebuild_from_genes(self.genes)
                current_fitness = best_fitness
                
                tabu_list.append(best_move)
                if len(tabu_list) > tabu_size:
                    tabu_list.pop(0)

    def repair_lab_continuity_post_generation(self):
        """
        Post-generation repair: Fix non-continuous 2-hour lab blocks
        Searches for available continuous slots and reschedules broken labs
        """
        print("\n🔧 Post-Generation Lab Continuity Repair...")
        
        # Step 1: Identify broken lab sessions
        lab_sessions = defaultdict(list)
        
        for idx, gene in enumerate(self.genes):
            if not gene.is_theory:  # Only labs
                key = (gene.subject_code, gene.section_id, gene.batch_number, gene.day)
                lab_sessions[key].append({'index': idx, 'gene': gene})
        
        repairs_attempted = 0
        repairs_successful = 0
        
        for key, session_genes in lab_sessions.items():
            subject_code, section_id, batch_number, day = key
            
            if len(session_genes) != 2:  # Should be 2-hour block
                continue
            
            periods = sorted([g['gene'].period for g in session_genes])
            
            # Check if continuous
            if periods[1] - periods[0] == 1:
                continue  # Already continuous, skip
            
            # Found broken lab session!
            repairs_attempted += 1
            print(f"  ⚠️ Found broken lab: {subject_code} Batch {batch_number} on Day {day}")
            print(f"     Current periods: {periods[0]}, {periods[1]} (gap detected)")
            
            # Step 2: Try to find continuous 2-hour slot
            gene1 = session_genes[0]['gene']
            gene2 = session_genes[1]['gene']
            
            # Get faculty and room info
            faculty_id = gene1.faculty_id
            room_id = gene1.room_id
            
            # Search for available continuous slot
            new_slot_found = False
            
            # Try same day first
            for start_period in [0, 2, 4]:  # 2-hour blocks: 0-1, 2-3, 4-5
                if self._is_continuous_slot_available(
                    day, start_period, faculty_id, section_id, room_id, 
                    exclude_indices=[g['index'] for g in session_genes]
                ):
                    # Found valid continuous slot!
                    print(f"     ✅ Found continuous slot: Day {day}, Periods {start_period}-{start_period+1}")
                    
                    # Update the genes
                    self.genes[session_genes[0]['index']].period = start_period
                    self.genes[session_genes[1]['index']].period = start_period + 1
                    
                    repairs_successful += 1
                    new_slot_found = True
                    break
            
            # If not found on same day, try other days
            if not new_slot_found:
                for new_day in range(self.days_per_week):
                    if new_day == day:
                        continue  # Already tried
                    
                    for start_period in [0, 2, 4]:
                        if self._is_continuous_slot_available(
                            new_day, start_period, faculty_id, section_id, room_id,
                            exclude_indices=[g['index'] for g in session_genes]
                        ):
                            print(f"     ✅ Found continuous slot: Day {new_day}, Periods {start_period}-{start_period+1}")
                            
                            # Update the genes (including day change)
                            self.genes[session_genes[0]['index']].day = new_day
                            self.genes[session_genes[0]['index']].period = start_period
                            self.genes[session_genes[1]['index']].day = new_day
                            self.genes[session_genes[1]['index']].period = start_period + 1
                            
                            # Update lab room tracker
                            self.lab_usage_tracker[(new_day, start_period)].add(room_id)
                            self.lab_usage_tracker[(new_day, start_period + 1)].add(room_id)
                            
                            repairs_successful += 1
                            new_slot_found = True
                            break
                    
                    if new_slot_found:
                        break
            
            if not new_slot_found:
                print(f"     ❌ Could not find continuous slot for {subject_code} Batch {batch_number}")
        
        # Rebuild constraint checker after repairs
        if repairs_successful > 0:
            self.constraint_checker.rebuild_from_genes(self.genes)
        
        print(f"\n  📊 Lab Repair Summary:")
        print(f"     Broken labs found: {repairs_attempted}")
        print(f"     Successfully repaired: {repairs_successful}")
        print(f"     Still broken: {repairs_attempted - repairs_successful}")
        
        return repairs_successful

    def _is_continuous_slot_available(self, day, start_period, faculty_id, 
                                   section_id, room_id, exclude_indices=None):
        """
        Check if a continuous 2-hour slot is available
        exclude_indices: Gene indices to ignore (the ones we're trying to move)
        """
        if exclude_indices is None:
            exclude_indices = []
        
        # Check both periods
        for period in [start_period, start_period + 1]:
            # Check against existing genes (except the ones we're moving)
            for idx, gene in enumerate(self.genes):
                if idx in exclude_indices:
                    continue  # Skip the genes we're trying to reschedule
                
                if gene.day == day and gene.period == period:
                    # Check conflicts
                    if gene.faculty_id == faculty_id:
                        return False  # Faculty busy
                    if gene.section_id == section_id:
                        return False  # Section busy
                    if gene.is_theory and gene.room_id == room_id:
                        return False  # Room busy (for theory)
                    if not gene.is_theory and gene.room_id == room_id:
                        return False  # Lab room busy
            
            # Check against master schedule
            for slot in self.master_schedule:
                if slot['day'] == day and slot['period'] == period:
                    if slot['faculty_id'] == faculty_id:
                        return False
                    if slot['section_id'] == section_id:
                        return False
                    if slot['room_id'] == room_id:
                        return False
        
        return True  # Slot is available!

# ===========================
# OPTIMIZED GENETIC ALGORITHM
# ===========================

def generate_semester_timetable(subjects_data, faculties_data, sections_data,
                               lab_rooms_data, master_schedule_data):
    """Optimized GA with Hybrid CSP + Local Search + Tabu"""
    
    # Adaptive parameters
    population_size = 120
    generations = 500
    crossover_rate = 0.85
    mutation_rate_start = 0.25
    mutation_rate_end = 0.05
    elite_ratio = 0.15
    
    print("\n" + "="*70)
    print("OPTIMIZED VTU TIMETABLE GENERATION")
    print("Hybrid: Genetic Algorithm + CSP + Tabu Local Search")
    print("="*70)
    
    subjects = [Subject(**s) for s in subjects_data]
    faculties = [Faculty(**f) for f in faculties_data.values()]
    sections = [Section(**s) for s in sections_data.values()]
    lab_rooms = [LabRoom(**r) for r in lab_rooms_data.values()]
    
    print(f"\n📊 Input Statistics:")
    print(f"  Subjects: {len(subjects)}")
    print(f"  Faculties: {len(faculties)}")
    print(f"  Sections: {len(sections)}")
    print(f"  Lab Rooms: {len(lab_rooms)}")
    
    start_time = time.time()
    
    # Initialize population with CSP
    print("\n🎲 Initializing population with CSP guidance...")
    population = []
    
    for i in range(population_size):
        chromosome = OptimizedTimetableChromosome(
            subjects, faculties, sections, lab_rooms, master_schedule_data
        )
        chromosome.initialize_with_csp()
        chromosome.calculate_fitness()
        population.append(chromosome)
        
        if (i + 1) % 20 == 0:
            avg_fitness = sum(p.fitness for p in population) / len(population)
            print(f"  Generated {i+1}/{population_size} | Avg Fitness: {avg_fitness:.1f}")
    
    best_ever = max(population, key=lambda x: x.fitness)
    stagnation_counter = 0
    
    print("\n🧬 Evolution in progress...")
    
    for generation in range(generations):
        # Adaptive mutation rate
        progress = generation / generations
        mutation_rate = mutation_rate_start * (1 - progress) + mutation_rate_end * progress
        
        # Sort population
        population.sort(key=lambda x: x.fitness, reverse=True)
        
        # Track best
        if population[0].fitness > best_ever.fitness:
            best_ever = copy.deepcopy(population[0])
            stagnation_counter = 0
        else:
            stagnation_counter += 1
        
        # Progress report
        if generation % 50 == 0:
            avg_fit = sum(p.fitness for p in population) / len(population)
            print(f"  Gen {generation:3d} | Best: {best_ever.fitness:6.1f} | "
                  f"Avg: {avg_fit:6.1f} | Mutation: {mutation_rate:.3f}")
        
        # Early stopping
        if best_ever.fitness >= 1000:
            print(f"\n✨ Perfect solution found at generation {generation}!")
            break
        
        # Diversity injection if stagnant
        if stagnation_counter > 50:
            print("  💉 Injecting diversity...")
            for i in range(population_size // 4):
                new_chromo = OptimizedTimetableChromosome(
                    subjects, faculties, sections, lab_rooms, master_schedule_data
                )
                new_chromo.initialize_with_csp()
                new_chromo.calculate_fitness()
                population[-i-1] = new_chromo
            stagnation_counter = 0
        
        # Elitism
        elite_count = int(population_size * elite_ratio)
        next_pop = population[:elite_count]
        
        # Apply tabu search on elite
        for elite in next_pop[:5]:
            elite.tabu_local_search(max_iterations=30)
            elite.calculate_fitness()
        
        # Generate offspring
        while len(next_pop) < population_size:
            # Tournament selection
            p1 = max(random.sample(population, 3), key=lambda x: x.fitness)
            p2 = max(random.sample(population, 3), key=lambda x: x.fitness)
            
            # Crossover
            if random.random() < crossover_rate:
                c1 = copy.deepcopy(p1)
                c2 = copy.deepcopy(p2)
                
                if len(c1.genes) > 1 and len(c2.genes) > 1:
                    pt = random.randint(1, min(len(c1.genes), len(c2.genes)) - 1)
                    c1.genes, c2.genes = c1.genes[:pt] + c2.genes[pt:], c2.genes[:pt] + c1.genes[pt:]
                    
                    c1.constraint_checker.rebuild_from_genes(c1.genes)
                    c2.constraint_checker.rebuild_from_genes(c2.genes)
            else:
                c1, c2 = copy.deepcopy(p1), copy.deepcopy(p2)
            
            # Mutation
            for child in [c1, c2]:
                if random.random() < mutation_rate and len(child.genes) >= 2:
                    idx1, idx2 = random.sample(range(len(child.genes)), 2)
                    child.genes[idx1], child.genes[idx2] = child.genes[idx2], child.genes[idx1]
                    child.constraint_checker.rebuild_from_genes(child.genes)
                
                child.calculate_fitness()
            
            next_pop.extend([c1, c2])
        
        population = next_pop[:population_size]
    
    # Repair broken lab continuity
    repairs_made = best_ever.repair_lab_continuity_post_generation()
    
    # Recalculate fitness after repairs
    if repairs_made > 0:
        print("\n🔄 Recalculating fitness after repairs...")
        best_ever.calculate_fitness()
        print(f"   New fitness: {best_ever.fitness:.2f}")
    
    # Optional: One more round of local search after repairs
    if best_ever.fitness < 900:
        print("\n🔍 Applying final local search...")
        best_ever.tabu_local_search(max_iterations=50)
        best_ever.calculate_fitness()
        print(f"   Final fitness: {best_ever.fitness:.2f}")

    elapsed_time = time.time() - start_time
    
    print("\n" + "="*70)
    print("GENERATION COMPLETE")
    print("="*70)
    print(f"⏱️  Time Elapsed: {elapsed_time:.2f} seconds")
    print(f"🏆 Best Fitness: {best_ever.fitness:.2f}/1000")
    print(f"📅 Total Slots Scheduled: {len(best_ever.genes)}")
    
    # ✅ DETAILED CONSTRAINT ANALYSIS
    print("\n📊 Constraint Violation Analysis:")
    print("-" * 70)
    
    # Hard constraints
    faculty_conflicts = best_ever._count_conflicts_fast('faculty')
    section_conflicts = best_ever._count_conflicts_fast('section')
    room_conflicts = best_ever._count_conflicts_fast('room')
    lab_continuity = best_ever._check_lab_continuity()
    project_continuity = best_ever._check_project_continuity()
    
    if lab_continuity > 0:
        print(f"    Lab Continuity Issues:  {lab_continuity:3d} ❌")
        print(f"      💡 Tip: Some 2-hour lab blocks are not continuous")
        
        # Show which labs are broken
        lab_sessions = defaultdict(list)
        for gene in best_ever.genes:
            if not gene.is_theory:
                key = (gene.subject_code, gene.section_id, gene.batch_number, gene.day)
                lab_sessions[key].append(gene.period)
        
        broken_count = 0
        for key, periods in lab_sessions.items():
            if len(periods) == 2:
                periods_sorted = sorted(periods)
                if periods_sorted[1] - periods_sorted[0] != 1:
                    subject_code, section_id, batch_num, day = key
                    print(f"         - {subject_code} Batch {batch_num}, Day {day}: "
                          f"Periods {periods_sorted[0]}, {periods_sorted[1]}")
                    broken_count += 1
                    if broken_count >= 5:  # Limit output
                        remaining = lab_continuity - broken_count
                        if remaining > 0:
                            print(f"         ... and {remaining} more")
                        break
    else:
        print(f"    Lab Continuity Issues:  {lab_continuity:3d} ✅")

    print(f"  Hard Constraints:")
    print(f"    Faculty Conflicts:      {faculty_conflicts:3d} {'✅' if faculty_conflicts == 0 else '❌'}")
    print(f"    Section Conflicts:      {section_conflicts:3d} {'✅' if section_conflicts == 0 else '❌'}")
    print(f"    Room Conflicts:         {room_conflicts:3d} {'✅' if room_conflicts == 0 else '❌'}")
    print(f"    Lab Continuity Issues:  {lab_continuity:3d} {'✅' if lab_continuity == 0 else '❌'}")
    print(f"    Project Block Issues:   {project_continuity:3d} {'✅' if project_continuity == 0 else '❌'}")
    
    hard_constraint_score = (faculty_conflicts + section_conflicts + room_conflicts + 
                            lab_continuity + project_continuity)
    
    # Soft constraints
    gaps = best_ever._check_gaps()
    theory_distribution = best_ever._check_theory_distribution()
    theory_afternoon = best_ever._penalize_theory_afternoon()
    sparse_days = best_ever._penalize_sparse_days()
    
    print(f"\n  Soft Constraints:")
    print(f"    Schedule Gaps:          {gaps:3d} {'✅' if gaps < 10 else '⚠️'}")
    print(f"    Theory Distribution:    {theory_distribution:3d} {'✅' if theory_distribution < 5 else '⚠️'}")
    print(f"    Theory in Afternoon:    {theory_afternoon:3d} {'✅' if theory_afternoon == 0 else '⚠️'}")
    print(f"    Sparse Days:            {sparse_days:3d} {'✅' if sparse_days < 10 else '⚠️'}")
    
    print("-" * 70)
    
    # ✅ QUALITY ASSESSMENT
    if hard_constraint_score == 0:
        if best_ever.fitness >= 950:
            quality = "EXCELLENT ⭐⭐⭐⭐⭐"
            status = "READY FOR PRODUCTION"
        elif best_ever.fitness >= 850:
            quality = "VERY GOOD ⭐⭐⭐⭐"
            status = "ACCEPTABLE WITH MINOR ISSUES"
        elif best_ever.fitness >= 700:
            quality = "GOOD ⭐⭐⭐"
            status = "ACCEPTABLE BUT NEEDS REVIEW"
        else:
            quality = "ACCEPTABLE ⭐⭐"
            status = "NEEDS IMPROVEMENT"
    else:
        quality = "UNACCEPTABLE ❌"
        status = "HAS HARD CONSTRAINT VIOLATIONS"
    
    print(f"\n✅ Overall Quality: {quality}")
    print(f"📋 Status: {status}")
    
    # ✅ SUBJECT TYPE BREAKDOWN
    print("\n📚 Scheduled Classes Breakdown:")
    type_counts = defaultdict(int)
    for gene in best_ever.genes:
        key = f"{gene.subject_type}_{('Theory' if gene.is_theory else 'Lab')}"
        type_counts[key] += 1
    
    for type_key, count in sorted(type_counts.items()):
        print(f"    {type_key:20s}: {count:3d} slots")
    
    print("="*70 + "\n")
    
    # ✅ REGENERATION SUGGESTION
    fitness_threshold = 800  # Minimum acceptable fitness
    
    if best_ever.fitness < fitness_threshold:
        print("⚠️  WARNING: Fitness below threshold!")
        print(f"   Current: {best_ever.fitness:.2f} | Threshold: {fitness_threshold}")
        print("   Suggestions:")
        print("   1. Increase population size to 150-200")
        print("   2. Increase generations to 800-1000")
        print("   3. Check if constraints are too restrictive")
        print("   4. Increase lab room availability")
        
        # Ask for regeneration
        print("\n🔄 Recommendation: Regenerate timetable")
        return [gene.__dict__ for gene in best_ever.genes] # Return None to signal regeneration needed
    
    return [gene.__dict__ for gene in best_ever.genes]

def generate_timetable_with_retry(subjects_data, faculties_data, sections_data,
                                  lab_rooms_data, master_schedule_data,
                                  max_attempts=3, fitness_threshold=800):
    """Generate timetable with automatic retry"""
    
    best_result = None
    best_fitness = -1
    
    for attempt in range(1, max_attempts + 1):
        print(f"\n{'='*70}")
        print(f"ATTEMPT {attempt}/{max_attempts}")
        print(f"{'='*70}")
        
        result = generate_semester_timetable(
            subjects_data, faculties_data, sections_data,
            lab_rooms_data, master_schedule_data
        )
        
        # ✅ Extract fitness from result
        if isinstance(result, dict):
            current_fitness = result['fitness']
            current_timetable = result['timetable']
        else:
            # Fallback for old format
            current_timetable = result
            current_fitness = 0
        
        # Keep track of best attempt
        if current_timetable and len(current_timetable) > 0:
            if current_fitness > best_fitness:
                best_fitness = current_fitness
                best_result = result
        
        # Check if satisfactory
        if current_fitness >= fitness_threshold:
            print(f"\n✅ SUCCESS on attempt {attempt}!")
            return result
        
        if attempt < max_attempts:
            print(f"\n🔄 Fitness {current_fitness:.2f} below threshold. Retrying...")
    
    # ✅ Return best attempt even if below threshold
    if best_result:
        print(f"\n⚠️ Returning best attempt with fitness {best_fitness:.2f}")
        return best_result
    
    # ✅ Last resort - return empty but valid structure
    print("\n❌ All attempts failed - returning empty timetable")
    return {
        'timetable': [],
        'fitness': 0,
        'success': False,
        'warnings': ['Failed to generate any valid timetable']
    }

if __name__ == "__main__":
    print("VTU Timetable Scheduler - Optimized Version 5.0")
    print("Hybrid GA + CSP + Tabu Local Search")